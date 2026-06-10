// OWASP-aligned fuzz suite for our edge functions.
//
// Runs with: deno test --allow-net --allow-env supabase/functions/_shared/security_test.ts
//
// These tests hit the LIVE deployed edge functions over HTTPS using the
// project's anon key (sandbox-safe). The contract is "no matter what the
// attacker sends, the function fails closed: 4xx/5xx without leaking
// secrets, stack traces, or internal paths."
import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";

const URL = Deno.env.get("VITE_SUPABASE_URL")!;
const ANON = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;

const ENDPOINTS = [
  { name: "process-document", path: "/functions/v1/process-document" },
  { name: "generate-visual",  path: "/functions/v1/generate-visual" },
  { name: "generate-slides",  path: "/functions/v1/generate-slides" },
];

const OWASP_PAYLOADS = [
  // A03: Injection — SQL, NoSQL, command, template
  { name: "sql_injection",   body: { documentText: "'; DROP TABLE users;--", modeId: "smart-notes" } },
  { name: "nosql_injection", body: { documentText: { "$gt": "" }, modeId: "smart-notes" } },
  { name: "shell_injection", body: { documentText: "$(rm -rf /)", modeId: "smart-notes" } },
  { name: "ssti",            body: { documentText: "{{7*7}}${{<%[%'\"}}%\\", modeId: "smart-notes" } },
  // A03: XSS
  { name: "xss_script",      body: { documentText: "<script>alert(document.cookie)</script>", modeId: "smart-notes" } },
  { name: "xss_svg",         body: { documentText: "<svg onload=alert(1)>", modeId: "smart-notes" } },
  // A04: Insecure design — malformed shape
  { name: "wrong_types",     body: { documentText: 42, modeId: [] } },
  { name: "extra_proto",     body: { __proto__: { admin: true }, documentText: "x", modeId: "smart-notes" } },
  // A05: Misconfig — modeId fuzz
  { name: "path_traversal",  body: { documentText: "x", modeId: "../../../etc/passwd" } },
  { name: "modeid_long",     body: { documentText: "x", modeId: "a".repeat(5000) } },
  // A08: Software/data integrity — oversized payload (must reject)
  { name: "oversized",       body: { documentText: "A".repeat(2_000_000), modeId: "smart-notes" } },
  // A10: SSRF probe via modeId
  { name: "ssrf_modeid",     body: { documentText: "x", modeId: "http://169.254.169.254/" } },
];

const FORBIDDEN_LEAKS = [
  "service_role",
  "SUPABASE_SERVICE_ROLE_KEY",
  "LOVABLE_API_KEY",
  "/home/deno",
  "Deno.core",
  "at Object.<anonymous>",
  "TypeError:",
];

function assertNoLeak(text: string, label: string) {
  for (const needle of FORBIDDEN_LEAKS) {
    assert(!text.includes(needle), `${label} leaked secret/stack: ${needle}`);
  }
}

async function call(path: string, body: unknown, token?: string) {
  const resp = await fetch(`${URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token ?? ANON}`,
      Origin: "http://localhost",
    },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
  const text = await resp.text();
  return { status: resp.status, text };
}

// 1) Unauthenticated requests must be rejected (401/403).
for (const e of ENDPOINTS) {
  Deno.test(`auth: ${e.name} rejects requests with no JWT`, async () => {
    const resp = await fetch(`${URL}${e.path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: "http://localhost" },
      body: JSON.stringify({ documentText: "x", modeId: "smart-notes" }),
    });
    const text = await resp.text();
    assert([401, 403].includes(resp.status), `expected 401/403, got ${resp.status}`);
    assertNoLeak(text, e.name);
  });

  Deno.test(`auth: ${e.name} rejects forged JWT`, async () => {
    const { status, text } = await call(e.path, { documentText: "x", modeId: "smart-notes" }, "not.a.real.jwt");
    assert([401, 403].includes(status), `expected 401/403, got ${status}`);
    assertNoLeak(text, e.name);
  });
}

// 2) Malformed body (non-JSON) returns 400, never 500-with-stack.
for (const e of ENDPOINTS) {
  Deno.test(`shape: ${e.name} rejects non-JSON body`, async () => {
    const { status, text } = await call(e.path, "not json {{{");
    assert(status >= 400 && status < 500, `expected 4xx, got ${status}`);
    assertNoLeak(text, e.name);
  });
}

// 3) OWASP payload fuzz against process-document — must fail closed.
for (const p of OWASP_PAYLOADS) {
  Deno.test(`fuzz: process-document handles ${p.name} safely`, async () => {
    const { status, text } = await call("/functions/v1/process-document", p.body);
    // Any response from 200..599 is fine AS LONG AS it doesn't leak.
    assertNoLeak(text, p.name);
    // Oversized must specifically be rejected.
    if (p.name === "oversized") {
      assert([400, 401, 413].includes(status), `oversized payload accepted with ${status}`);
    }
    // Path-traversal / very long / non-string modeId must be 4xx.
    if (["path_traversal", "modeid_long", "wrong_types", "ssrf_modeid"].includes(p.name)) {
      assert(status >= 400 && status < 500, `${p.name} not rejected (status ${status})`);
    }
  });
}

// 4) Origin allow-list: a foreign Origin header must be rejected.
Deno.test("origin: foreign Origin is forbidden", async () => {
  const resp = await fetch(`${URL}/functions/v1/process-document`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ANON}`,
      Origin: "https://evil.example.com",
    },
    body: JSON.stringify({ documentText: "x", modeId: "smart-notes" }),
  });
  const text = await resp.text();
  assertEquals(resp.status, 403);
  assertNoLeak(text, "origin");
});

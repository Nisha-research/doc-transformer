// Shared guard helpers for edge functions: origin allowlist, auth, rate-limit,
// AI response cache, and usage ledger. Service-role only writes.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

export const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" };

export function isAllowedOrigin(req: Request): boolean {
  const origin = req.headers.get("origin") || req.headers.get("referer") || "";
  if (!origin) return false;
  try {
    const host = new URL(origin).hostname;
    return (
      host === "localhost" ||
      host === "127.0.0.1" ||
      host.endsWith(".lovable.app") ||
      host.endsWith(".lovable.dev") ||
      host.endsWith(".lovableproject.com")
    );
  } catch {
    return false;
  }
}

function admin() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}

export async function requireUser(req: Request): Promise<
  { ok: true; userId: string } | { ok: false; response: Response }
> {
  const auth = req.headers.get("Authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token) {
    return {
      ok: false,
      response: new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: jsonHeaders,
      }),
    };
  }
  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!);
  const { data, error } = await sb.auth.getUser(token);
  if (error || !data?.user) {
    return {
      ok: false,
      response: new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: jsonHeaders,
      }),
    };
  }
  return { ok: true, userId: data.user.id };
}

/** Returns null if within limit, otherwise an HTTP 429 Response. */
export async function checkRateLimit(
  userId: string,
  bucket: string,
  max: number,
  windowSec = 3600,
): Promise<Response | null> {
  const sb = admin();
  const now = new Date();
  const windowStart = new Date(
    Math.floor(now.getTime() / (windowSec * 1000)) * (windowSec * 1000)
  ).toISOString();

  // Try insert; on conflict increment.
  const { data: existing } = await sb
    .from("rate_limits")
    .select("count")
    .eq("user_id", userId)
    .eq("bucket", bucket)
    .eq("window_start", windowStart)
    .maybeSingle();

  if (existing) {
    if (existing.count >= max) {
      return new Response(
        JSON.stringify({ error: `Rate limit exceeded for ${bucket}. Try again later.` }),
        { status: 429, headers: { ...jsonHeaders, "Retry-After": String(windowSec) } }
      );
    }
    await sb
      .from("rate_limits")
      .update({ count: existing.count + 1 })
      .eq("user_id", userId)
      .eq("bucket", bucket)
      .eq("window_start", windowStart);
  } else {
    await sb.from("rate_limits").insert({
      user_id: userId, bucket, window_start: windowStart, count: 1,
    });
  }
  return null;
}

export async function sha256(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

export async function cacheGet(key: string): Promise<unknown | null> {
  const sb = admin();
  const { data } = await sb
    .from("ai_cache")
    .select("payload, hits")
    .eq("cache_key", key)
    .maybeSingle();
  if (!data) return null;
  // Fire-and-forget hit counter
  sb.from("ai_cache")
    .update({ hits: (data.hits ?? 0) + 1, last_hit_at: new Date().toISOString() })
    .eq("cache_key", key)
    .then(() => {});
  return (data as any).payload;
}

export async function cachePut(key: string, mode: string, payload: unknown): Promise<void> {
  const sb = admin();
  await sb.from("ai_cache").upsert(
    { cache_key: key, mode, payload, last_hit_at: new Date().toISOString() },
    { onConflict: "cache_key" }
  );
}

export async function logUsage(args: {
  userId: string | null;
  mode: string;
  kind: "text" | "visual" | "slides";
  ms?: number;
  cacheHit?: boolean;
  status?: "ok" | "error" | "rate_limited";
  tokens?: number;
}): Promise<void> {
  const sb = admin();
  await sb.from("usage_events").insert({
    user_id: args.userId,
    mode: args.mode,
    kind: args.kind,
    ms: args.ms ?? null,
    cache_hit: !!args.cacheHit,
    status: args.status ?? "ok",
    tokens: args.tokens ?? null,
  });
}

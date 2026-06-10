// Centralized safe error response. NEVER returns stack traces, raw provider
// output, or anything else that could leak secrets/internal layout.
//
// `log` is captured server-side (visible in edge function logs) but the
// response body sent to the client is always a stable, user-friendly string.

import { jsonHeaders } from "./guard.ts";

export type ErrorKind =
  | "unauthorized"
  | "forbidden"
  | "bad_request"
  | "too_large"
  | "unsupported"
  | "rate_limited"
  | "ai_failed"
  | "server";

const MESSAGES: Record<ErrorKind, { status: number; message: string }> = {
  unauthorized: { status: 401, message: "Unauthorized" },
  forbidden:    { status: 403, message: "Forbidden" },
  bad_request:  { status: 400, message: "Invalid request" },
  too_large:    { status: 413, message: "Request too large" },
  unsupported:  { status: 415, message: "Unsupported file type" },
  rate_limited: { status: 429, message: "Rate limit exceeded. Try again later." },
  ai_failed:    { status: 502, message: "AI processing failed. Please try again." },
  server:       { status: 500, message: "Something went wrong. Please try again." },
};

export function safeError(kind: ErrorKind, opts: { log?: unknown; detail?: string; retryAfterSec?: number } = {}): Response {
  const { status, message } = MESSAGES[kind];
  if (opts.log !== undefined) {
    // eslint-disable-next-line no-console
    console.error(`[${kind}]`, opts.log instanceof Error ? opts.log.message : opts.log);
  }
  const headers: Record<string, string> = { ...jsonHeaders };
  if (opts.retryAfterSec) headers["Retry-After"] = String(opts.retryAfterSec);
  // `detail` is only attached when it's a known-safe string (e.g. "modeId").
  const body = opts.detail
    ? JSON.stringify({ error: message, detail: opts.detail })
    : JSON.stringify({ error: message });
  return new Response(body, { status, headers });
}

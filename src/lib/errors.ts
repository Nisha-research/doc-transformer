// Centralized client-side error helpers. Never leak stack traces, secrets,
// or raw provider responses to the UI — always map to a friendly message.

export type FriendlyError = {
  title: string;
  message: string;
  retryable: boolean;
  retryAfterSec?: number;
  code: string;
};

const GENERIC: FriendlyError = {
  title: "Something went wrong",
  message: "We hit an unexpected error. Please try again in a moment.",
  retryable: true,
  code: "unknown",
};

export function friendlyFromStatus(status: number, retryAfter?: string | null, fallback?: string): FriendlyError {
  if (status === 401 || status === 403) {
    return {
      title: "Please sign in",
      message: "Your session expired or this action is not allowed. Sign back in and try again.",
      retryable: false,
      code: status === 401 ? "unauthorized" : "forbidden",
    };
  }
  if (status === 413) {
    return {
      title: "File too large",
      message: "The combined content is over 1MB. Trim or split the document and try again.",
      retryable: false,
      code: "payload_too_large",
    };
  }
  if (status === 415) {
    return {
      title: "Unsupported file",
      message: "We only accept PDF, TXT, PPT and PPTX uploads.",
      retryable: false,
      code: "unsupported_media",
    };
  }
  if (status === 429) {
    const sec = retryAfter ? Number(retryAfter) : undefined;
    return {
      title: "Slow down",
      message: sec
        ? `You've hit the per-hour limit. Try again in about ${Math.ceil(sec / 60)} minute(s).`
        : "You've hit the per-hour limit. Try again shortly.",
      retryable: true,
      retryAfterSec: Number.isFinite(sec) ? sec : undefined,
      code: "rate_limited",
    };
  }
  if (status === 402) {
    return {
      title: "AI credits exhausted",
      message: "The workspace AI credits ran out. Please top up and retry.",
      retryable: false,
      code: "payment_required",
    };
  }
  if (status >= 500) {
    return {
      title: "Service unavailable",
      message: fallback || "Our AI provider is temporarily unavailable. Please retry in a few seconds.",
      retryable: true,
      code: "server_error",
    };
  }
  return { ...GENERIC, message: fallback || GENERIC.message };
}

export function friendlyFromException(err: unknown): FriendlyError {
  if (err instanceof TypeError) {
    return {
      title: "Network problem",
      message: "We couldn't reach the server. Check your connection and try again.",
      retryable: true,
      code: "network",
    };
  }
  return GENERIC;
}

/** Retry helper with exponential backoff, only for retryable errors. */
export async function withRetry<T>(
  fn: () => Promise<T>,
  opts: { retries?: number; baseMs?: number } = {},
): Promise<T> {
  const { retries = 2, baseMs = 600 } = opts;
  let lastErr: unknown;
  for (let i = 0; i <= retries; i++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      const fe = (e as any)?.friendly as FriendlyError | undefined;
      if (fe && !fe.retryable) throw e;
      if (i === retries) throw e;
      await new Promise(r => setTimeout(r, baseMs * Math.pow(2, i)));
    }
  }
  throw lastErr;
}

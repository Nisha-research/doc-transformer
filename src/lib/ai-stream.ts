import { supabase } from "@/integrations/supabase/client";

const PROCESS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-document`;

interface StreamDocumentParams {
  documentText: string;
  modeId: string;
  knowledgeLevel: number;
  fileTags: string[];
  onDelta: (text: string) => void;
  onDone: () => void;
  onError: (error: string) => void;
}

async function authHeader(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? `Bearer ${token}` : `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`;
}

export async function streamDocument({
  documentText,
  modeId,
  knowledgeLevel,
  fileTags,
  onDelta,
  onDone,
  onError,
}: StreamDocumentParams) {
  let resp: Response;
  try {
    resp = await fetch(PROCESS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: await authHeader() },
      body: JSON.stringify({ documentText, modeId, knowledgeLevel, fileTags }),
    });
  } catch {
    onError("We couldn't reach the server. Check your connection and try again.");
    return;
  }

  if (!resp.ok) {
    const { friendlyFromStatus } = await import("@/lib/errors");
    const retryAfter = resp.headers.get("Retry-After");
    let serverMsg: string | undefined;
    try {
      const body = await resp.json();
      if (body && typeof body.error === "string") serverMsg = body.error;
    } catch { /* ignore */ }
    const fe = friendlyFromStatus(resp.status, retryAfter, serverMsg);
    onError(fe.message);
    return;
  }

  if (!resp.body) {
    onError("The server didn't return a response. Please retry.");
    return;
  }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let newlineIndex: number;
    while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
      let line = buffer.slice(0, newlineIndex);
      buffer = buffer.slice(newlineIndex + 1);

      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (line.startsWith(":") || line.trim() === "") continue;
      if (!line.startsWith("data: ")) continue;

      const jsonStr = line.slice(6).trim();
      if (jsonStr === "[DONE]") {
        onDone();
        return;
      }

      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.choices?.[0]?.delta?.content as string | undefined;
        if (content) onDelta(content);
      } catch {
        buffer = line + "\n" + buffer;
        break;
      }
    }
  }

  if (buffer.trim()) {
    for (let raw of buffer.split("\n")) {
      if (!raw) continue;
      if (raw.endsWith("\r")) raw = raw.slice(0, -1);
      if (!raw.startsWith("data: ")) continue;
      const jsonStr = raw.slice(6).trim();
      if (jsonStr === "[DONE]") continue;
      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.choices?.[0]?.delta?.content as string | undefined;
        if (content) onDelta(content);
      } catch { /* ignore */ }
    }
  }

  onDone();
}

export async function extractTextFromFile(file: File): Promise<string> {
  if (file.type === "text/plain") return await file.text();
  return await file.text();
}

export async function extractTextFromFiles(files: { file: File; tag: string }[]): Promise<string> {
  const parts: string[] = [];
  for (const { file, tag } of files) {
    const text = await extractTextFromFile(file);
    parts.push(`=== Document: ${tag} ===\n${text}`);
  }
  return parts.join("\n\n");
}

export { authHeader };

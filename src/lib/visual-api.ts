// Client for the generate-visual edge function.
import { authHeader } from "./ai-stream";

const URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-visual`;

export interface ComicPanel {
  title: string;
  scene: string;
  caption: string;
  dialogue?: string;
  image: string | null;
}
export interface ComicResult {
  kind: 'comic-strip';
  title: string;
  subtitle: string;
  style: string;
  panels: ComicPanel[];
}

export interface InfographicStat { value: string; label: string; description?: string; }
export interface InfographicSection { heading: string; body: string; icon?: string; }
export interface InfographicResult {
  kind: 'infographic';
  title: string;
  subtitle: string;
  takeaway: string;
  stats: InfographicStat[];
  sections: InfographicSection[];
  palette: { primary: string; secondary: string; accent: string; bg: string };
}

interface Params {
  kind: 'comic-strip' | 'infographic';
  documentText: string;
  knowledgeLevel: number;
  fileTags: string[];
}

export async function generateVisual<T = ComicResult | InfographicResult>(params: Params): Promise<T> {
  const { friendlyFromStatus, friendlyFromException } = await import('@/lib/errors');
  let r: Response;
  try {
    r = await fetch(URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: await authHeader() },
      body: JSON.stringify(params),
    });
  } catch (e) {
    throw new Error(friendlyFromException(e).message);
  }
  if (!r.ok) {
    let serverMsg: string | undefined;
    try { const b = await r.json(); if (typeof b?.error === 'string') serverMsg = b.error; } catch { /* ignore */ }
    throw new Error(friendlyFromStatus(r.status, r.headers.get('Retry-After'), serverMsg).message);
  }
  return r.json();
}

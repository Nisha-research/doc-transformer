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
  const r = await fetch(URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: await authHeader() },
    body: JSON.stringify(params),
  });
  if (!r.ok) {
    const body = await r.json().catch(() => ({ error: `Error ${r.status}` }));
    throw new Error(body.error || `Error ${r.status}`);
  }
  return r.json();
}

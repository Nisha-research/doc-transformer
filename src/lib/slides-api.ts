import { authHeader } from "./ai-stream";

const URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-slides`;

export type SlideLayout = 'title' | 'section' | 'bullets' | 'two-column' | 'stat' | 'quote' | 'conclusion';

export interface SlideColumn { heading: string; body: string }
export interface SlideStat { value: string; label: string; context?: string }
export interface SlideQuote { text: string; author?: string }

export interface Slide {
  id?: string;
  layout: SlideLayout;
  title: string;
  subtitle?: string;
  bullets?: string[];
  columns?: SlideColumn[];
  stat?: SlideStat;
  quote?: SlideQuote;
  notes?: string;
}

export interface DeckTheme { primary: string; accent: string; bg: string; ink: string }

export interface SlideDeck {
  title: string;
  subtitle: string;
  theme: DeckTheme;
  slides: Slide[];
}

export async function generateSlides(params: {
  documentText: string;
  knowledgeLevel: number;
  fileTags: string[];
  slideCount?: number;
}): Promise<SlideDeck> {
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

// Generates structured visual content: comic strips (with AI-drawn panels)
// and infographics (with structured stats + sections). Returns JSON, not stream.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  corsHeaders, jsonHeaders, isAllowedOrigin, requireUser,
  checkRateLimit, cacheGet, cachePut, logUsage, sha256,
} from "../_shared/guard.ts";

const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

interface ComicPanel {
  title: string;
  scene: string;        // visual description for image gen
  caption: string;      // narration under panel
  dialogue?: string;    // speech bubble text
}
interface InfographicStat { value: string; label: string; description?: string; }
interface InfographicSection { heading: string; body: string; icon?: string; }
interface InfographicData {
  title: string;
  subtitle: string;
  takeaway: string;
  stats: InfographicStat[];
  sections: InfographicSection[];
  palette: { primary: string; secondary: string; accent: string; bg: string; };
}

async function callChat(systemPrompt: string, userMessage: string, key: string, model = "google/gemini-2.5-flash") {
  const r = await fetch(GATEWAY, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
    }),
  });
  if (!r.ok) throw new Error(`AI error ${r.status}: ${await r.text()}`);
  const j = await r.json();
  return j.choices?.[0]?.message?.content ?? "";
}

function extractJson<T>(text: string): T {
  // strip code fences
  const cleaned = text.replace(/```json\s*|```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("No JSON in response");
  return JSON.parse(cleaned.slice(start, end + 1));
}

async function generateComicImage(scene: string, style: string, key: string): Promise<string | null> {
  try {
    const r = await fetch(GATEWAY, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [
          {
            role: "user",
            content: `${style} comic book panel illustration: ${scene}. Bright colors, bold ink outlines, dynamic composition, no text or speech bubbles in the image, single panel, square aspect ratio.`,
          },
        ],
        modalities: ["image", "text"],
      }),
    });
    if (!r.ok) {
      console.error("image gen failed", r.status, await r.text());
      return null;
    }
    const j = await r.json();
    const url = j.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    return url ?? null;
  } catch (e) {
    console.error("image gen exception", e);
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (!isAllowedOrigin(req)) {
    return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: jsonHeaders });
  }
  const auth = await requireUser(req);
  if (!auth.ok) return auth.response;
  const userId = auth.userId;

  const started = Date.now();
  let kindForLog = "unknown";

  try {
    const { kind, documentText, knowledgeLevel, fileTags } = await req.json();
    kindForLog = kind || "unknown";

    const rl = await checkRateLimit(userId, "visual_gen", 10, 3600);
    if (rl) {
      await logUsage({ userId, mode: kindForLog, kind: "visual", status: "rate_limited" });
      return rl;
    }

    const key = Deno.env.get("LOVABLE_API_KEY");
    if (!key) return new Response(JSON.stringify({ error: "AI not configured" }), { status: 500, headers: jsonHeaders });

    const level = knowledgeLevel < 33 ? "beginner" : knowledgeLevel < 66 ? "intermediate" : "expert";
    const docSlice = String(documentText || "").slice(0, 40000);
    const ctx = `Source documents: ${(fileTags || []).join(", ")}\nReader level: ${level}\n\nContent:\n${docSlice}`;

    const cacheKey = await sha256(`visual:${kind}:${level}:${docSlice}`);
    const cached = await cacheGet(cacheKey);
    if (cached) {
      await logUsage({ userId, mode: kindForLog, kind: "visual", cacheHit: true, ms: Date.now() - started });
      return new Response(JSON.stringify(cached), { headers: jsonHeaders });
    }

    if (kind === "comic-strip") {
      const sys = `You are a comic book writer + illustrator director. Read the source document and produce a 6-panel comic that visually teaches the core concept. Return STRICT JSON only, no prose, no markdown fences.

Schema:
{
  "title": "Comic title",
  "subtitle": "1-line tagline",
  "style": "vibrant flat 2D cartoon | noir ink wash | manga | watercolor storybook | retro pop-art (pick one that fits the topic)",
  "panels": [
    { "title": "Panel name", "scene": "vivid visual description of characters/setting/action - no text in image", "caption": "narration text (1-2 sentences)", "dialogue": "optional speech bubble text or empty string" }
  ]
}
Exactly 6 panels. Keep dialogue short. Scenes must be visually descriptive enough for an illustrator (characters, environment, colors, mood, action).`;

      const raw = await callChat(sys, ctx, key);
      const spec = extractJson<{ title: string; subtitle: string; style: string; panels: ComicPanel[] }>(raw);
      const panels = (spec.panels || []).slice(0, 6);
      const images = await Promise.all(
        panels.map(p => generateComicImage(p.scene, spec.style || "vibrant flat 2D cartoon", key))
      );
      const panelsOut = panels.map((p, i) => ({ ...p, image: images[i] }));
      const out = { kind: "comic-strip", title: spec.title, subtitle: spec.subtitle, style: spec.style, panels: panelsOut };
      await cachePut(cacheKey, "comic-strip", out);
      await logUsage({ userId, mode: "comic-strip", kind: "visual", ms: Date.now() - started });
      return new Response(JSON.stringify(out), { headers: jsonHeaders });
    }

    if (kind === "infographic") {
      const sys = `You are an infographic designer. Read the source document and produce a structured visual infographic specification. Return STRICT JSON only, no prose, no markdown fences.

Schema:
{
  "title": "Headline (max 8 words)",
  "subtitle": "Supporting line (max 18 words)",
  "takeaway": "The single most important insight",
  "template": "process | timeline | pyramid | comparison | stats",
  "stats": [ { "value": "73%", "label": "short label", "description": "1-line context" } ],
  "sections": [ { "heading": "Section title", "body": "2-4 sentence explanation", "icon": "one-word lucide icon hint like 'zap' 'shield' 'trending-up' 'brain' 'globe' 'users' 'lightbulb' 'target' 'rocket' 'chart'" } ],
  "palette": { "primary": "#hex", "secondary": "#hex", "accent": "#hex", "bg": "#hex" }
}
Pick the template that best fits the content. Pick a palette intentionally — finance=deep blues+gold, biology=greens+coral, tech=violets+cyan, history=warm sepias, climate=teals+amber, etc.`;

      const raw = await callChat(sys, ctx, key);
      const spec = extractJson<InfographicData>(raw);
      const out = { kind: "infographic", ...spec };
      await cachePut(cacheKey, "infographic", out);
      await logUsage({ userId, mode: "infographic", kind: "visual", ms: Date.now() - started });
      return new Response(JSON.stringify(out), { headers: jsonHeaders });
    }

    return new Response(JSON.stringify({ error: "Unknown kind" }), { status: 400, headers: jsonHeaders });
  } catch (e) {
    console.error("generate-visual error", e);
    await logUsage({ userId, mode: kindForLog, kind: "visual", status: "error", ms: Date.now() - started });
    return new Response(JSON.stringify({ error: "Visual generation failed. Please try again." }),
      { status: 500, headers: jsonHeaders });
  }
});

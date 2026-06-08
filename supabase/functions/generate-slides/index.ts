// Generates a structured slide deck (JSON) from source document(s).

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  corsHeaders, jsonHeaders, isAllowedOrigin, requireUser,
  checkRateLimit, cacheGet, cachePut, logUsage, sha256,
} from "../_shared/guard.ts";

const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";


function extractJson<T>(text: string): T {
  const cleaned = text.replace(/```json\s*|```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("No JSON in response");
  return JSON.parse(cleaned.slice(start, end + 1));
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

  try {
    const { documentText, knowledgeLevel, fileTags, slideCount } = await req.json();

    const rl = await checkRateLimit(userId, "slides_gen", 10, 3600);
    if (rl) {
      await logUsage({ userId, mode: "slide-deck", kind: "slides", status: "rate_limited" });
      return rl;
    }

    const key = Deno.env.get("LOVABLE_API_KEY");
    if (!key) return new Response(JSON.stringify({ error: "AI not configured" }), { status: 500, headers: jsonHeaders });

    const level = knowledgeLevel < 33 ? "beginner" : knowledgeLevel < 66 ? "intermediate" : "expert";
    const count = Math.min(Math.max(Number(slideCount) || 10, 6), 18);
    const docSlice = String(documentText || "").slice(0, 60000);

    const cacheKey = await sha256(`slides:${level}:${count}:${docSlice}`);
    const cached = await cacheGet(cacheKey);
    if (cached) {
      await logUsage({ userId, mode: "slide-deck", kind: "slides", cacheHit: true, ms: Date.now() - started });
      return new Response(JSON.stringify(cached), { headers: jsonHeaders });
    }

    const sys = `You are a senior presentation designer. Read the source document and produce a polished ${count}-slide deck that teaches the core ideas. Return STRICT JSON only — no prose, no markdown fences.

Schema:
{
  "title": "Deck title (max 9 words)",
  "subtitle": "One supporting line",
  "theme": {
    "primary": "#hex",
    "accent":  "#hex",
    "bg":      "#hex",
    "ink":     "#hex"
  },
  "slides": [
    {
      "layout": "title" | "section" | "bullets" | "two-column" | "stat" | "quote" | "conclusion",
      "title": "Slide title",
      "subtitle": "Optional subtitle/eyebrow",
      "bullets": ["short point"],
      "columns": [{ "heading": "...", "body": "..." }],
      "stat":   { "value": "73%", "label": "what it measures", "context": "1-line" },
      "quote":  { "text": "...", "author": "..." },
      "notes":  "Speaker notes"
    }
  ]
}

Rules:
- Slide 1 MUST be layout="title".
- Include at least one "section" divider and one "stat" or "quote" slide if possible.
- Last slide MUST be layout="conclusion".
- Bullets: max 6 per slide, each ≤ 14 words.
- Always include "notes".
- Reader level: ${level}.

Source documents: ${(fileTags || []).join(", ")}

Content:
${docSlice}`;

    const r = await fetch(GATEWAY, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: sys },
          { role: "user", content: "Generate the deck now." },
        ],
      }),
    });
    if (!r.ok) {
      console.error("AI gateway error", r.status, await r.text());
      await logUsage({ userId, mode: "slide-deck", kind: "slides", status: "error", ms: Date.now() - started });
      return new Response(JSON.stringify({ error: "AI processing failed. Please try again." }),
        { status: 500, headers: jsonHeaders });
    }
    const j = await r.json();
    const raw = j.choices?.[0]?.message?.content ?? "";
    const spec = extractJson<any>(raw);

    await cachePut(cacheKey, "slide-deck", spec);
    await logUsage({ userId, mode: "slide-deck", kind: "slides", ms: Date.now() - started });
    return new Response(JSON.stringify(spec), { headers: jsonHeaders });
  } catch (e) {
    console.error("generate-slides error", e);
    await logUsage({ userId, mode: "slide-deck", kind: "slides", status: "error", ms: Date.now() - started });
    return new Response(JSON.stringify({ error: "Slide generation failed. Please try again." }),
      { status: 500, headers: jsonHeaders });
  }
});

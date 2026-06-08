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
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { documentText, knowledgeLevel, fileTags, slideCount } = await req.json();
    const key = Deno.env.get("LOVABLE_API_KEY");
    if (!key) {
      return new Response(JSON.stringify({ error: "AI not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const level = knowledgeLevel < 33 ? "beginner" : knowledgeLevel < 66 ? "intermediate" : "expert";
    const count = Math.min(Math.max(Number(slideCount) || 10, 6), 18);
    const docSlice = String(documentText || "").slice(0, 60000);

    const sys = `You are a senior presentation designer. Read the source document and produce a polished ${count}-slide deck that teaches the core ideas. Return STRICT JSON only — no prose, no markdown fences.

Schema:
{
  "title": "Deck title (max 9 words)",
  "subtitle": "One supporting line",
  "theme": {
    "primary": "#hex (dominant brand color matching topic mood)",
    "accent":  "#hex (sharp contrast accent)",
    "bg":      "#hex (light slide background)",
    "ink":     "#hex (body text color)"
  },
  "slides": [
    {
      "layout": "title" | "section" | "bullets" | "two-column" | "stat" | "quote" | "conclusion",
      "title": "Slide title",
      "subtitle": "Optional subtitle/eyebrow",
      "bullets": ["short point", "..."],          // for bullets / two-column / conclusion
      "columns": [{ "heading": "...", "body": "..." }, { "heading": "...", "body": "..." }],  // for two-column
      "stat":   { "value": "73%", "label": "what it measures", "context": "1-line explainer" }, // for stat
      "quote":  { "text": "...", "author": "..." },  // for quote
      "notes":  "Speaker notes — 2-3 sentences for the presenter"
    }
  ]
}

Rules:
- Slide 1 MUST be layout="title" (deck title + subtitle).
- Include at least one "section" divider and one "stat" or "quote" slide if the source supports it.
- Last slide MUST be layout="conclusion" with key takeaways as bullets.
- Bullets: max 6 per slide, each ≤ 14 words. No nested bullets.
- Always include "notes" for every slide.
- Pick a theme palette that matches the topic mood (finance=navy+gold, biology=greens, tech=violets+cyan, history=warm sepias, etc).
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
      return new Response(JSON.stringify({ error: "AI processing failed. Please try again." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const j = await r.json();
    const raw = j.choices?.[0]?.message?.content ?? "";
    const spec = extractJson<any>(raw);

    return new Response(JSON.stringify(spec), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-slides error", e);
    return new Response(JSON.stringify({ error: "Slide generation failed. Please try again." }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

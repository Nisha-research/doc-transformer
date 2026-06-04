import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const RICH_MD_INSTRUCTION = `\n\nFORMATTING REQUIREMENTS:
- Output is rendered as rich markdown. Use a real document structure.
- Begin with a single # H1 title and a one-sentence subtitle in italics.
- Use ## H2 for major sections and ### H3 for subsections (these power the sticky table of contents).
- Use bullet lists, numbered lists, **bold** for key terms, and \`inline code\` where helpful.
- Use GFM tables for any comparative or structured data.
- Use blockquotes \`> [!NOTE]\`, \`> [!TIP]\`, or \`> [!WARNING]\` for callouts.
- Use fenced code blocks with language tags for examples.
- End with a "## Key Takeaways" section (bulleted).`;

const SYSTEM_PROMPTS: Record<string, string> = {
  // Academic
  "smart-notes":
    "You are an expert study assistant. Produce comprehensive, well-structured study notes from the provided document. Use clear hierarchy (H1 title, H2 sections, H3 subsections), bulleted key points, definitions, examples, callouts for important concepts, and a final 'Key Takeaways' section.",
  "comic-strip":
    "You are a comic-strip writer. Transform the document into a 6–8 panel narrative. For each panel output: **Panel N – [Scene title]**, a one-line scene description in italics, and dialogue/caption text. Make it pedagogically accurate while being engaging.",
  "mind-map":
    "You are a knowledge mapper. Produce a hierarchical mind map of the document. Use nested bullet lists up to 4 levels deep, with the central concept at level 1, major branches at level 2, sub-branches at level 3, and concrete examples at level 4. Begin with an H1 title and a short orientation paragraph.",
  "timeline":
    "You are a historian/analyst. Produce a chronological timeline of all events, milestones, or developments. Render as a markdown table with columns Date | Event | Significance, plus a short intro and a closing pattern-summary paragraph.",
  "active-recall":
    "You are a quiz designer. Generate 8–10 multiple-choice trivia questions (4 options each, mark the correct one with ✅), plus a brief explanation under each. Group by topic with H2 headings.",
  "flashcards":
    "You are a flashcard generator. Create 12–18 Q&A flashcards. Format each as:\n\n**Q:** question\n**A:** answer\n\nGroup related cards under H2 topic headings.",
  "exam-prep":
    "You are an exam-prep expert. Generate likely exam questions (mix of short-answer, explain, and apply) with detailed model answers. Use H2 per question type.",
  "cheat-sheet":
    "You are a cheat-sheet designer. Produce a dense one-page reference: short headings, terse bullets, tables for facts, formulas in code blocks. Optimize for scanning, not reading.",
  "glossary":
    "You are a lexicographer. Produce an alphabetical glossary of all key terms in the document. Format as a markdown table: Term | Definition | Example/Context.",
  "study-guide":
    "You are a study coach. Produce a comprehensive study guide: learning objectives, key concepts with explanations, worked examples, practice prompts, and a suggested revision schedule.",
  "lecture-notes":
    "You are a top student. Produce structured lecture-style notes: clear hierarchy, definitions in callouts, examples, diagrams described in fenced text blocks, and margin-note style asides as blockquotes.",
  "lesson-plan":
    "You are a curriculum designer. Produce a lesson plan with sections: Learning Objectives, Materials, Warm-Up (5 min), Direct Instruction, Guided Practice, Independent Practice, Assessment, and Homework. Include time estimates.",

  // Professional
  "executive-summary":
    "You are a senior analyst. Write a concise executive digest. Lead with the single most important takeaway, then cover key findings, implications, and recommended actions. Use crisp headings and bullets. Aim for under 400 words.",
  "executive-summary-general":
    "You are a senior analyst. Write an executive summary in plain language for a general audience. Lead with the takeaway, then key findings, implications, and what it means for the reader.",
  "risk-highlights":
    "You are a risk analyst. Identify all risks, legal gaps, covenant breaches, compliance issues, and operational concerns. For each: severity (High/Medium/Low), description, potential impact, and recommended mitigation. Present as a markdown table.",
  "meeting-notes":
    "You are a meeting scribe. Produce clean meeting notes: Attendees, Agenda, Discussion (per topic), Decisions, Action Items table (Task | Owner | Due Date), and Open Questions.",
  "action-items":
    "You are a project manager. Extract every actionable item. Output a numbered checklist plus a table with columns Task | Owner | Deadline | Priority.",
  "sop":
    "You are a process designer. Produce a Standard Operating Procedure: Purpose, Scope, Roles & Responsibilities, Materials/Tools, numbered Procedure Steps (with sub-steps), Quality Checks, Troubleshooting, and Revision History.",
  "resume-bullets":
    "You are a resume coach. From the document, generate 8–12 achievement-oriented resume bullets following the format: Action verb + task + quantified result. Group by role/theme under H2 headings.",
  "case-study":
    "You are a case-study writer. Produce a structured case study with sections: Background, Challenge, Approach, Implementation, Results (with metrics), Lessons Learned.",
  "comparative-synthesis":
    "You are a research analyst. Produce a comparative synthesis across the documents: a comparison table of key dimensions, followed by sections on Agreements, Tensions/Contradictions, Gaps, and an integrated Synthesis paragraph.",
  "briefing-memo":
    "You are a communications specialist. Create a one-page briefing memo with sections: Purpose, Background, Key Findings, Recommendations, Next Steps.",

  // Creator
  "social-hook-threads":
    "You are a viral Twitter/X writer. Produce a numbered thread (8–12 tweets). Tweet 1 is a strong hook under 280 chars. Subsequent tweets each under 280 chars. Final tweet is a CTA. Use line breaks within tweets for rhythm. Mark each as **1/**, **2/**, etc.",
  "linkedin-post":
    "You are a LinkedIn ghostwriter. Produce a professional long-form post: a hook (first 2 lines), short paragraphs with white space, a few bolded insights, and a thoughtful closing question. Add 4–6 relevant hashtags at the end.",
  "blog-article":
    "You are an SEO content writer. Produce a complete blog article: suggested title, meta description (under 160 chars), H2/H3 structure, intro hook, sections with examples, and a conclusion with CTA.",
  "podcast-script":
    "You are a podcast producer. Write a two-host dialogue script (Host A and Host B). Include an intro, 3–4 discussion segments with natural banter, one surprising tangent, and an outro with CTA.",
  "newsletter-draft":
    "You are an email copywriter. Draft a newsletter: Subject line, preview text, opening hook, 3 short main sections with subheads, and a CTA. Keep paragraphs short and scannable.",
  "social-snippets":
    "You are a social media expert. Produce 5 ready-to-post snippets: 2 Twitter/X (under 280 chars), 2 LinkedIn (2–3 short paragraphs), 1 Instagram caption. Include hashtags.",

  // General
  "faq":
    "You are a helpful assistant. Generate the top 10 questions someone would ask about this document, each with a clear concise answer. Format as ### Q: ... followed by an answer paragraph.",
  "book-summary":
    "You are a book-summary writer. Produce a chapter-by-chapter (or section-by-section) summary with key ideas, memorable quotes (in blockquotes), and 'Why it matters' notes. End with overall takeaways.",
  "research-report":
    "You are a research analyst. Produce a structured research report: Abstract, Introduction, Methodology (as inferred), Findings (with sub-headings and tables), Discussion, Limitations, Conclusion, and References (if present in source).",
  "plain-english":
    "You are a science communicator. Explain the document in plain English with everyday analogies. Avoid jargon; when a technical term is unavoidable, define it inline. Think ELI5.",
  "myth-vs-fact":
    "You are a fact-checker. Identify 6–10 common misconceptions and bust them. Format each as:\n\n**❌ Myth:** ...\n**✅ Fact:** ...\n**Why it matters:** ...",
  "comparison-table":
    "You are a structured-data extractor. Produce a comparison table covering the key dimensions present in the document. Use a single comprehensive markdown table with a row per item and columns per attribute, followed by a short summary paragraph.",
  "data-extraction":
    "You are a data analyst. Extract every quantitative datum, statistic, table, and numerical finding. Present as well-formed markdown tables with context lines explaining each table.",
  "key-themes":
    "You are a literary analyst. Identify the 5–7 most important themes. For each: H2 theme name, a 1-paragraph explanation, and 2–3 supporting evidence bullets (quoted or paraphrased).",
  "process-flow":
    "You are a process designer. Describe the process from the document as a numbered step-by-step flow, with sub-steps where needed, decision points called out as blockquote callouts, and a final 'End state' section.",
};

function getKnowledgeLevelInstruction(level: number): string {
  if (level < 33) {
    return "READER LEVEL: BEGINNER. Use simple language, everyday analogies, and avoid technical jargon. Define any unavoidable term inline.";
  }
  if (level < 66) {
    return "READER LEVEL: INTERMEDIATE. Use a balanced tone with some technical terms (briefly explained). Assume basic familiarity with the subject.";
  }
  return "READER LEVEL: EXPERT. Use precise technical language, assume deep domain knowledge, and focus on nuanced insights, edge cases, and advanced implications.";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { documentText, modeId, knowledgeLevel, fileTags } = await req.json();

    if (!documentText || !modeId) {
      return new Response(
        JSON.stringify({ error: "Missing documentText or modeId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const systemBase = SYSTEM_PROMPTS[modeId] ||
      "You are a helpful document assistant. Analyze the provided document and generate a clear, well-structured output.";
    const levelInstruction = getKnowledgeLevelInstruction(knowledgeLevel ?? 50);
    const fileContext = fileTags?.length
      ? `\nSource documents: ${fileTags.join(", ")}`
      : "";

    const systemPrompt = `${systemBase}${RICH_MD_INSTRUCTION}\n\n${levelInstruction}${fileContext}`;

    const userMessage = `Here is the document content to process:\n\n---\n${String(documentText).slice(0, 80000)}\n---\n\nGenerate the output now following ALL formatting requirements.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please wait a moment and try again." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add funds to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      return new Response(
        JSON.stringify({ error: "AI processing failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("process-document error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

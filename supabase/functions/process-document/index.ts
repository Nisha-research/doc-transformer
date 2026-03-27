import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPTS: Record<string, string> = {
  // Student modes
  "smart-notes":
    "You are an expert study assistant. Generate comprehensive, well-structured notes from the provided document text. Use clear headings, bullet points, and highlight key concepts. Make the notes scannable and easy to review.",
  flashcards:
    'You are a flashcard generator. Create Q&A flashcard pairs from the document. Format each card as:\n\n**Q:** [question]\n**A:** [answer]\n\nCreate 10-15 high-quality flashcards covering the most important concepts.',
  "exam-prep":
    "You are an exam preparation expert. Generate likely exam questions with detailed model answers from the document. Include a mix of short-answer, explain, and apply-type questions. Format clearly with question numbers.",
  "active-recall":
    "You are a learning coach. Generate 5 comprehension-testing questions from the document. After each question, provide the answer hidden behind a separator line (---). Questions should test understanding, not just memorization.",

  // Professional modes
  "executive-summary":
    "You are a senior analyst. Write a concise executive summary (TL;DR) of the document. Lead with the key takeaway, then cover main points, implications, and recommended actions. Keep it under 300 words.",
  "action-items":
    "You are a project manager. Extract all actionable items from the document. For each, identify: the task, responsible party (if mentioned), deadline (if mentioned), and priority level. Format as a numbered checklist.",
  "briefing-memo":
    "You are a communications specialist. Create a one-page briefing memo from the document. Include: Purpose, Background, Key Findings, Recommendations, and Next Steps sections.",
  "risk-highlights":
    "You are a risk analyst. Identify and highlight all risks, issues, legal gaps, and concerns in the document. Rate each as High/Medium/Low severity and suggest mitigation strategies.",

  // Creator modes
  "blog-outline":
    "You are a content strategist. Create an SEO-ready blog outline from the document. Include: suggested title, meta description, H2/H3 headings, key points under each section, and a call-to-action.",
  "social-snippets":
    "You are a social media expert. Create 5 ready-to-post social media snippets from the document. Include versions for Twitter/X (under 280 chars) and LinkedIn (2-3 paragraphs). Add relevant hashtags.",
  "podcast-script":
    "You are a podcast producer. Transform the document into a two-host dialogue script. Include an intro, discussion segments, interesting tangents, and an outro. Make it conversational and engaging.",
  "newsletter-draft":
    "You are an email copywriter. Draft a newsletter edition based on the document. Include: subject line, preview text, opening hook, main content sections, and a CTA. Keep it scannable with short paragraphs.",

  // Researcher modes
  "data-extraction":
    "You are a data analyst. Extract all quantitative data, statistics, tables, and numerical findings from the document. Present them in a structured, tabular format with context for each data point.",
  "comparative-analysis":
    "You are a research analyst. Perform a comparative analysis of the themes, arguments, and findings in the document. Identify agreements, contradictions, and gaps. Present in a structured comparison format.",
  "citation-map":
    "You are an academic researcher. Map the key claims in the document to their supporting evidence. Format as: Claim → Evidence → Source. Highlight any unsupported claims.",
  "hypothesis-gen":
    "You are a research advisor. Based on the document, identify knowledge gaps and generate 3-5 research hypotheses or questions worth investigating. Include rationale and suggested methodology for each.",

  // General public modes
  "plain-english":
    "You are a science communicator. Explain the document content in plain, simple English that anyone can understand. Use analogies, everyday examples, and avoid jargon. Think ELI5 (Explain Like I'm 5).",
  "myth-vs-fact":
    "You are a fact-checker. Based on the document, identify common misconceptions related to the topic and bust them with evidence. Format as: ❌ Myth: ... ✅ Fact: ... for each item.",
  "faq-generator":
    "You are a helpful assistant. Generate the top 10 most likely questions someone would ask about this document, and answer each clearly and concisely.",
  timeline:
    "You are a historian/analyst. Create a chronological timeline of all events, milestones, or developments mentioned in the document. Format with dates/periods and descriptions.",
};

function getKnowledgeLevelInstruction(level: number): string {
  if (level < 33) {
    return "IMPORTANT: The reader is a BEGINNER. Use simple language, everyday analogies, and avoid technical jargon. Explain concepts as if teaching someone new to the subject.";
  }
  if (level < 66) {
    return "IMPORTANT: The reader has INTERMEDIATE knowledge. Use a balanced tone with some technical terms (briefly explained). Assume basic familiarity with the subject.";
  }
  return "IMPORTANT: The reader is an EXPERT. Use precise technical language, assume deep domain knowledge, and focus on nuanced insights, edge cases, and advanced implications.";
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

    const systemBase = SYSTEM_PROMPTS[modeId] || "You are a helpful document assistant. Analyze the provided document and generate useful output.";
    const levelInstruction = getKnowledgeLevelInstruction(knowledgeLevel ?? 50);
    const fileContext = fileTags?.length
      ? `\nDocuments analyzed: ${fileTags.join(", ")}`
      : "";

    const systemPrompt = `${systemBase}\n\n${levelInstruction}${fileContext}`;

    const userMessage = `Here is the document content to process:\n\n---\n${documentText.slice(0, 50000)}\n---\n\nPlease generate the output now.`;

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

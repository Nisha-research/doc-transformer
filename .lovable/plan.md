# StudyForge → Premium AI Knowledge Workspace

This is a very large scope (themes, workspace layout, 23+ output modes, Claude-style docs, NotebookLM-style visuals, PPT/image/audio generators, flashcards, quizzes, chat-with-docs, exports). Building all of it in one pass would produce shallow features. I'll deliver it in focused phases so each lands polished. **This plan covers Phase 1–3; later phases will be planned after you see the foundation.**

---

## Phase 1 — Foundation (this round)

### 1. Theme System

- `next-themes` provider + `ThemeToggle` in navbar (sun/moon).
- Light: white bg / slate-50 cards / slate-900 text. Dark: slate-950 / slate-900 / slate-100.
- Update `index.css` HSL tokens for both modes, smooth color transitions.
- Persists to localStorage, respects system preference.

### 2. Expanded Output Modes (from your image + spec — 28 total)

Reorganized into 4 categories with icons:

- **Academic**: Structured Study Notes, Comic Strip Panels, Interactive Mind Map, Chronological Timeline, Active Recall MCQ Trivia, Flashcards, Exam Prep, Cheat Sheet, Glossary, Study Guide, Lecture Notes, Lesson Plan
- **Professional**: Covenant/Risk Assessment, Investigative Executive Digest, Meeting Notes, SOP Generator, Resume Bullets, Case Study,Chronological Timeline,  Comparative Synthesis
- **Creator**: Social Hook Threads (Twitter), LinkedIn Post, Blog Article, Podcast Script
- **General**: Smart Notes, Executive Summary, FAQ, Book Summary, Research Report,Chronological Timeline, Comic Strip Panels, Interactive Mind Map

Each as a card with Lucide icon, gradient accent, description. Update edge-function system prompts to match.

### 3. Workspace Layout (replaces current ResultsView)

Three-pane shell using `react-resizable-panels`:

- **Left sidebar**: uploaded documents list, source chips, collections placeholder.
- **Center**: generated output (Claude-style renderer — see below).
- **Right sidebar**: quick actions (regenerate, change mode), export buttons (MD/PDF/TXT), related output suggestions.
- **Top toolbar**: editable workspace title, search input (stub), download menu, share (copy link), theme toggle.
- Collapsible sidebars; mobile = stacked tabs.

### 4. Claude-Style Document Renderer

- `react-markdown` + `remark-gfm` + `rehype-slug` + `rehype-autolink-headings`.
- Custom components for h1/h2/h3, callouts (`> [!NOTE]`), tables, code (with `react-syntax-highlighter`), bullets.
- Max-width ~850px, refined typography (serif display + sans body).
- Auto-generated **sticky TOC** on desktop from headings.
- Streaming-aware (renders as tokens arrive).

---

## Phase 2 — Interactive Outputs (next round)

Flashcards (flip + spaced repetition + progress), Active Recall quiz UI (MCQ/T-F/fill-blank with scoring), full Export Center (PDF via `jspdf`, DOCX via `docx`, PPTX via `pptxgenjs`), Mind Map visual (react-flow), Timeline visual, Comparison Tables.

## Phase 3 — Generators & Chat (later round)

PPT Generator with slide previews, Image Studio (Gemini image gen via Lovable AI), Audio/Podcast (TTS), AI Chat-with-documents (citations + multi-doc), Document Viewer with PDF.js.

---

## Technical Notes

- New deps: `next-themes`, `react-markdown`, `remark-gfm`, `rehype-slug`, `rehype-autolink-headings`, `react-syntax-highlighter`, `react-resizable-panels`.
- Edge function `process-document/index.ts`: extend `SYSTEM_PROMPTS` map with new mode IDs; instruct model to emit rich markdown (headings, callouts, tables) for long-form modes.
- `output-modes.ts`: full rewrite with 28 modes across 4 categories.
- New components: `ThemeToggle`, `WorkspaceShell`, `WorkspaceSidebar`, `WorkspaceToolbar`, `ActionsPanel`, `DocumentRenderer`, `TableOfContents`.
- `Index.tsx`: swap ResultsView → WorkspaceShell on results state.
- No backend schema changes in Phase 1 (still no-login, session-based).

---

**Confirm to proceed with Phase 1**, or tell me to re-prioritize (e.g. "do PPT generator first" or "skip workspace layout, just add modes + theme").
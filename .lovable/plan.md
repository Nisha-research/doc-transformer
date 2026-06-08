# StudyForge → Premium Knowledge Studio

This is a very large scope. I'll deliver it in 5 sequential phases so each milestone is verifiable in the preview. Confirm and I'll start with Phase A.

---

## Phase A — Security & Billing Protection
**Goal:** prevent abuse before we add expensive AI features.

1. **Auth**
   - Lovable Cloud email/password + Google sign-in.
   - `/auth` route (login/signup), session listener, protected routes.
   - `profiles` table (id, display_name, avatar_url) auto-created via trigger.
   - `user_roles` table + `has_role()` security-definer fn (admin role for dashboard).
2. **Per-user rate limiting**
   - `rate_limits` table: `user_id, bucket, window_start, count`.
   - Edge-function helper `checkRateLimit(userId, bucket, max, windowSec)` — 429 with retry-after when exceeded.
   - Buckets: `text_gen` (30/hr), `visual_gen` (10/hr), `slides_gen` (10/hr).
3. **AI response cache**
   - `ai_cache` table: `cache_key (sha256), mode, payload jsonb, created_at, hits`.
   - Key = sha256(modeId + knowledgeLevel + documentText).
   - Hit → return cached payload + increment `hits`; miss → call AI, store.
4. **Usage ledger** (feeds analytics)
   - `usage_events` table: `user_id, mode, ms, tokens_in, tokens_out, cache_hit, created_at`.

---

## Phase B — NotebookLM-grade Visuals
1. **Mind Map redesign**
   - Replace current view with **React Flow + Dagre** auto-layout.
   - Central node + colored branches per category, lucide icons, curved/animated edges, expand/collapse, zoom/pan/minimap.
   - Export PNG / SVG / Interactive HTML.
2. **Infographic redesign — 5 templates**
   - Process Flow, Timeline, Pyramid, Comparison Cards, Stats Grid.
   - Edge function returns a `template + sections[]` JSON; renderer picks template.
   - Designed with category palettes, gradients, large icons, Canva-feel.
   - Export PDF / PNG / HTML (existing `visual-exporters.ts`).

---

## Phase C — Performance / SEO / PWA
1. **Code splitting**: `React.lazy` for `SlideDeckView`, `MindMapView`, `InfographicView`, `ComicStripView`, `FlashcardsView`, `QuizView`, `TimelineView`, markdown renderer, syntax highlighter, pptxgenjs, html2canvas, jsPDF.
2. **Virtualization** for long documents (`react-window`).
3. **SEO**: per-route `react-helmet-async`, real `<title>`/description, JSON-LD Organization, sitemap.xml, robots.txt.
4. **PWA**: manifest + icons (home-screen install only, no SW unless asked).
5. Reduce heavy blur/gradients on initial paint; defer animations.

---

## Phase D — Analytics + Admin Dashboard
- `/admin` route (gated by `has_role('admin')`).
- Charts (recharts) over `usage_events` + `ai_cache`:
  - Most-used modes (bar)
  - Avg generation time per mode (bar)
  - API calls vs cache hits (stacked area, last 30d)
  - Credits/tokens consumed (line)
  - Active users (DAU/WAU/MAU)
  - p50/p95 latency
- CSV export.

---

## Phase E — Hero & IA Redesign ("Knowledge Studio")
1. **Hero**: new headline ("Transform Any Document Into Study Materials, Presentations, Mind Maps and Visual Knowledge"), dual CTA (Upload / See Demo), animated carousel preview (Notes → Mind Map → Infographic → Slides).
2. **IA**: replace 4 audience categories with 4 task tabs — **Learn / Visualize / Present / Create** — each grouping the existing modes; star the flagships.
3. **Bento layout** for output picker (large Smart Notes + Mind Map tiles, smaller secondary tiles).
4. **Knowledge Level slider**: 3 stops with emoji + live example snippet under each.
5. **Doc reader polish**: sticky TOC already exists; add colored callouts (note/warn/tip already in `DocumentRenderer`), collapsible `<details>` sections, nicer tables.
6. **Streaming status pills** ("✔ Summary  ⏳ Examples…") above the streamed doc.

---

## Tech notes
- Stack stays React 18 + Vite + Tailwind + Framer Motion + shadcn.
- New deps: `reactflow`, `dagre`, `react-helmet-async`, `react-window`, `recharts` (already present? check), `@supabase` already wired.
- All edge functions reuse existing origin-allowlist + generic error pattern.
- Roles in dedicated `user_roles` table; never on `profiles`.

---

**Estimated**: ~5 sequential AI turns, one phase each, each independently shippable. Reply "go" (or name a phase to start with) and I'll begin Phase A.

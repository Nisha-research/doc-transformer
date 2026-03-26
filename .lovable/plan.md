

# StudyForge — AI-Powered Document Intelligence Platform

## Vision
A no-login, privacy-first web app where anyone can upload documents and instantly get AI-generated study materials, professional summaries, and creative outputs — tailored to their knowledge level and use case.

---

## Phase 1: Core Foundation

### Landing Page
- Modern, polished design with gradient accents and smooth animations
- Hero section: "Transform any document into knowledge" with drag-and-drop upload zone
- Visible trust indicator: countdown timer showing "Your files will be deleted in X minutes"
- Anonymous session system using localStorage tokens (no login required)
- Output mode selector grid organized by audience (Students, Professionals, Creators, Researchers, General Public)

### File Upload System
- Drag-and-drop + click-to-upload for PDF, TXT, and PPT files
- Multi-file upload support (up to 5 files)
- File size limit (20MB per file) with client-side validation
- Upload progress indicators
- File type validation (MIME type checking)

### Knowledge Level Slider
- Beginner → Intermediate → Expert slider on every generation
- Controls AI output tone: analogies & simple language vs. technical density

---

## Phase 2: AI Processing & Output Modes

### Edge Function Backend (Lovable Cloud)
- File text extraction via edge functions
- AI processing through Lovable AI gateway
- Session-based file management with auto-cleanup timer

### Student Output Modes
- **Smart Notes**: Key points, bullets, structured summaries
- **Flashcards**: Q&A pairs with flip-card UI
- **Exam Prep**: Likely questions + model answers
- **Active Recall**: Auto-quiz with 3-5 questions after every generation

### Professional Output Modes
- **Executive Summary**: TL;DR for busy readers
- **Action Items**: Tasks, owners, deadlines extracted
- **Briefing Memo**: One-page stakeholder brief
- **Risk Highlights**: Flags issues, legal gaps

### Creator & Writer Modes
- **Blog Outline**: SEO-ready structure
- **Social Snippets**: Twitter/LinkedIn-ready posts
- **Podcast Script**: Two-host dialogue format
- **Newsletter Draft**: Ready-to-send copy

### Researcher Modes
- **Data Extraction**: Tables and numbers as structured output
- **Comparative Analysis**: Multi-doc side-by-side comparison
- **Citation Map**: Key claims + sources
- **Hypothesis Gen**: Gap analysis and ideas

### General Public Modes
- **Plain English**: ELI5 for any topic
- **Myth vs Fact**: Misconceptions busted
- **FAQ Generator**: Top 10 questions answered
- **Timeline**: Visual chronology of events

---

## Phase 3: Multi-Document Synthesis

- Upload multiple files and tag them (e.g., "Paper A", "Chapter 2")
- Compare & contrast mode: side-by-side analysis across documents
- Synthesis mode: unified summary pulling from all sources
- Source attribution: every claim linked back to its source document

---

## Phase 4: Active Recall & Spaced Repetition

- After any output generation, auto-generate 3-5 comprehension questions
- Flip-card quiz interface with self-rating (Easy / Medium / Hard)
- Session-based spaced repetition scheduling
- Progress tracking within the session
- Export flashcards as downloadable format

---

## Phase 5: Study Rooms (Collaboration)

- Create a shareable "Document Room" via unique link
- Multiple users can upload documents to the same room
- Real-time collaborative annotations on generated content
- Shared output generation — everyone sees results simultaneously
- Room auto-expires after configurable time (1-24 hours)

---

## Design System
- **Style**: Modern & polished with gradient accents
- **Color palette**: Deep navy primary, vibrant gradient accents per output category (matching your diagram — blue for students, teal for professionals, green for creators, etc.)
- **Animations**: Smooth transitions, loading states with progress indicators
- **Layout**: Clean, spacious, card-based UI
- **Mobile responsive**: Full functionality on all devices
- **Trust elements**: File deletion countdown, "no data stored" badges, open processing indicators

---

## Security & Privacy
- Anonymous sessions with auto-expiring tokens
- Rate limiting per session + IP
- Server-side file validation in edge functions
- No PII stored — files processed and discarded
- Visible countdown timer for file deletion
- Input sanitization before AI processing


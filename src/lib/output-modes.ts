import {
  BookOpen, Brain, ClipboardList, FileText, Lightbulb, MessageSquare, Newspaper,
  Mic, BarChart3, GitCompare, FlaskConical, HelpCircle, Clock, ShieldAlert,
  Briefcase, FileCheck, PenTool, Share2, Network, Map, Layers, GraduationCap,
  ScrollText, Presentation, BookMarked, Notebook, Users, Search, Hash, Linkedin,
  Twitter, FileSpreadsheet, Sparkles, Image as ImageIcon, Workflow
} from 'lucide-react';

export type CategoryId = 'academic' | 'professional' | 'creator' | 'general';

export interface OutputMode {
  id: string;
  label: string;
  description: string;
  icon: any;
  category: CategoryId;
}

export interface Category {
  id: CategoryId;
  label: string;
  description: string;
  gradient: string;
  modes: OutputMode[];
}

const M = (id: string, label: string, description: string, icon: any, category: CategoryId): OutputMode =>
  ({ id, label, description, icon, category });

export const categories: Category[] = [
  {
    id: 'academic',
    label: 'Academic',
    description: 'Study materials and learning aids',
    gradient: 'bg-gradient-student',
    modes: [
      M('smart-notes', 'Structured Study Notes', 'Headings, bullets, callouts & key concepts', BookOpen, 'academic'),
      M('comic-strip', 'Story Comic Strip Panels', 'Narrative panels that explain the concept', ImageIcon, 'academic'),
      M('mind-map', 'Interactive Concept Mind Map', 'Branching map of ideas & relationships', Network, 'academic'),
      M('timeline', 'Chronological Factual Timeline', 'Events & milestones in order', Clock, 'academic'),
      M('active-recall', 'Active Recall MCQ Trivia', 'Multiple-choice quiz to test understanding', Lightbulb, 'academic'),
      M('flashcards', 'Flashcards', 'Q&A pairs for spaced repetition', Brain, 'academic'),
      M('exam-prep', 'Exam Prep', 'Likely questions + model answers', ClipboardList, 'academic'),
      M('cheat-sheet', 'Cheat Sheet', 'One-page dense reference card', ScrollText, 'academic'),
      M('glossary', 'Glossary', 'Key terms with crisp definitions', BookMarked, 'academic'),
      M('study-guide', 'Study Guide', 'Comprehensive guided revision plan', GraduationCap, 'academic'),
      M('lecture-notes', 'Lecture Notes', 'Structured class-style notes', Notebook, 'academic'),
      M('lesson-plan', 'Lesson Plan', 'Objectives, activities & assessments', Layers, 'academic'),
    ],
  },
  {
    id: 'professional',
    label: 'Professional',
    description: 'Workplace-ready briefs and analyses',
    gradient: 'bg-gradient-professional',
    modes: [
      M('executive-summary', 'Investigative Executive Digest', 'TL;DR for busy decision-makers', FileText, 'professional'),
      M('risk-highlights', 'Covenant & Risk Assessment', 'Legal gaps, risks & mitigations', ShieldAlert, 'professional'),
      M('meeting-notes', 'Meeting Notes', 'Decisions, owners & next steps', Users, 'professional'),
      M('action-items', 'Action Items', 'Tasks, owners & deadlines', ClipboardList, 'professional'),
      M('sop', 'SOP Generator', 'Step-by-step standard operating procedure', Workflow, 'professional'),
      M('resume-bullets', 'Resume Bullet Generator', 'Achievement-driven resume bullets', Sparkles, 'professional'),
      M('case-study', 'Case Study', 'Problem, approach, outcome narrative', Briefcase, 'professional'),
      M('comparative-synthesis', 'Comparative Synthesis Report', 'Side-by-side multi-doc analysis', GitCompare, 'professional'),
      M('briefing-memo', 'Briefing Memo', 'One-page stakeholder brief', FileCheck, 'professional'),
    ],
  },
  {
    id: 'creator',
    label: 'Creator',
    description: 'Turn research into content',
    gradient: 'bg-gradient-creator',
    modes: [
      M('social-hook-threads', 'Social Hook Threads (Twitter/X)', 'Scroll-stopping thread with hooks', Twitter, 'creator'),
      M('linkedin-post', 'LinkedIn Post', 'Professional long-form post', Linkedin, 'creator'),
      M('blog-article', 'Blog Article', 'SEO-optimized article draft', PenTool, 'creator'),
      M('podcast-script', 'Podcast Script', 'Two-host dialogue format', Mic, 'creator'),
      M('newsletter-draft', 'Newsletter Draft', 'Ready-to-send email edition', Newspaper, 'creator'),
      M('social-snippets', 'Social Snippets Pack', '5+ ready-to-post variants', Share2, 'creator'),
    ],
  },
  {
    id: 'general',
    label: 'General',
    description: 'Understand anything in plain language',
    gradient: 'bg-gradient-general',
    modes: [
      M('infographic', 'Visual Infographic Card', 'Designed PDF/PNG/HTML with stats & sections', BarChart3, 'general'),
      M('executive-summary-general', 'Executive Summary', 'Plain-language TL;DR', FileText, 'general'),
      M('faq', 'FAQ Generator', 'Top 10 questions answered', HelpCircle, 'general'),
      M('book-summary', 'Book Summary', 'Chapter-by-chapter distillation', BookMarked, 'general'),
      M('research-report', 'Research Report', 'Structured findings & analysis', FlaskConical, 'general'),
      M('plain-english', 'Plain English (ELI5)', 'Simple language with analogies', MessageSquare, 'general'),
      M('myth-vs-fact', 'Myth vs Fact', 'Misconceptions busted with evidence', FileCheck, 'general'),
      M('comparison-table', 'Comparison Table', 'Structured comparison grid', FileSpreadsheet, 'general'),
      M('data-extraction', 'Data Extraction', 'Numbers & tables as structured output', BarChart3, 'general'),
      M('key-themes', 'Key Themes', 'Top themes with supporting evidence', Hash, 'general'),
      M('process-flow', 'Process Flow', 'Step-by-step workflow narrative', Workflow, 'general'),
    ],
  },
];

export function getCategoryById(id: CategoryId): Category | undefined {
  return categories.find(c => c.id === id);
}

export function getModeById(id: string): OutputMode | undefined {
  for (const cat of categories) {
    const mode = cat.modes.find(m => m.id === id);
    if (mode) return mode;
  }
  return undefined;
}

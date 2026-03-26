import { BookOpen, Brain, ClipboardList, FileText, Lightbulb, MessageSquare, Newspaper, Mic, BarChart3, GitCompare, Quote, FlaskConical, Languages, HelpCircle, Clock, ShieldAlert, Briefcase, FileCheck, PenTool, Share2 } from 'lucide-react';

export type CategoryId = 'student' | 'professional' | 'creator' | 'researcher' | 'general';

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

export const categories: Category[] = [
  {
    id: 'student',
    label: 'Students',
    description: 'Study smarter with AI-powered materials',
    gradient: 'bg-gradient-student',
    modes: [
      { id: 'smart-notes', label: 'Smart Notes', description: 'Key points, bullets & structured summaries', icon: BookOpen, category: 'student' },
      { id: 'flashcards', label: 'Flashcards', description: 'Q&A pairs with flip-card interface', icon: Brain, category: 'student' },
      { id: 'exam-prep', label: 'Exam Prep', description: 'Likely questions + model answers', icon: ClipboardList, category: 'student' },
      { id: 'active-recall', label: 'Active Recall', description: 'Auto-quiz to test understanding', icon: Lightbulb, category: 'student' },
    ],
  },
  {
    id: 'professional',
    label: 'Professionals',
    description: 'Get actionable insights from any document',
    gradient: 'bg-gradient-professional',
    modes: [
      { id: 'executive-summary', label: 'Executive Summary', description: 'TL;DR for busy readers', icon: FileText, category: 'professional' },
      { id: 'action-items', label: 'Action Items', description: 'Tasks, owners & deadlines extracted', icon: ClipboardList, category: 'professional' },
      { id: 'briefing-memo', label: 'Briefing Memo', description: 'One-page stakeholder brief', icon: Briefcase, category: 'professional' },
      { id: 'risk-highlights', label: 'Risk Highlights', description: 'Flags issues, legal gaps & risks', icon: ShieldAlert, category: 'professional' },
    ],
  },
  {
    id: 'creator',
    label: 'Creators & Writers',
    description: 'Transform research into content',
    gradient: 'bg-gradient-creator',
    modes: [
      { id: 'blog-outline', label: 'Blog Outline', description: 'SEO-ready content structure', icon: PenTool, category: 'creator' },
      { id: 'social-snippets', label: 'Social Snippets', description: 'Twitter/LinkedIn-ready posts', icon: Share2, category: 'creator' },
      { id: 'podcast-script', label: 'Podcast Script', description: 'Two-host dialogue format', icon: Mic, category: 'creator' },
      { id: 'newsletter-draft', label: 'Newsletter Draft', description: 'Ready-to-send copy', icon: Newspaper, category: 'creator' },
    ],
  },
  {
    id: 'researcher',
    label: 'Researchers',
    description: 'Analyze and compare academic content',
    gradient: 'bg-gradient-researcher',
    modes: [
      { id: 'data-extraction', label: 'Data Extraction', description: 'Tables & numbers as structured output', icon: BarChart3, category: 'researcher' },
      { id: 'comparative-analysis', label: 'Comparative Analysis', description: 'Multi-doc side-by-side comparison', icon: GitCompare, category: 'researcher' },
      { id: 'citation-map', label: 'Citation Map', description: 'Key claims + source attribution', icon: Quote, category: 'researcher' },
      { id: 'hypothesis-gen', label: 'Hypothesis Generator', description: 'Gap analysis & research ideas', icon: FlaskConical, category: 'researcher' },
    ],
  },
  {
    id: 'general',
    label: 'General Public',
    description: 'Understand anything in plain language',
    gradient: 'bg-gradient-general',
    modes: [
      { id: 'plain-english', label: 'Plain English', description: 'ELI5 for any complex topic', icon: Languages, category: 'general' },
      { id: 'myth-vs-fact', label: 'Myth vs Fact', description: 'Misconceptions busted with evidence', icon: FileCheck, category: 'general' },
      { id: 'faq-generator', label: 'FAQ Generator', description: 'Top 10 questions answered', icon: HelpCircle, category: 'general' },
      { id: 'timeline', label: 'Timeline', description: 'Visual chronology of events', icon: Clock, category: 'general' },
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

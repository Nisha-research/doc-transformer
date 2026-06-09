import { lazy, Suspense, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Copy, Download, Share2, Search, RefreshCw, FileText,
  Sparkles, Loader2, ChevronLeft, ChevronRight, Check,
  Eye, LayoutGrid,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { type OutputMode, getModeById } from '@/lib/output-modes';
import { type UploadedFile } from '@/lib/file-utils';
import { DocumentRenderer, TableOfContents, extractToc } from '@/components/DocumentRenderer';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// Heavy interactive/visual views are code-split to keep initial bundle small.
const FlashcardsView = lazy(() => import('@/components/views/FlashcardsView').then(m => ({ default: m.FlashcardsView })));
const QuizView = lazy(() => import('@/components/views/QuizView').then(m => ({ default: m.QuizView })));
const TimelineView = lazy(() => import('@/components/views/TimelineView').then(m => ({ default: m.TimelineView })));
const MindMapView = lazy(() => import('@/components/views/MindMapView').then(m => ({ default: m.MindMapView })));
const ComicStripView = lazy(() => import('@/components/views/ComicStripView').then(m => ({ default: m.ComicStripView })));
const InfographicView = lazy(() => import('@/components/views/InfographicView').then(m => ({ default: m.InfographicView })));
const SlideDeckView = lazy(() => import('@/components/views/SlideDeckView').then(m => ({ default: m.SlideDeckView })));

// Exporters are heavy (pptxgenjs, jsPDF, docx, html2canvas) — only load on demand.
const loadExporters = () => import('@/lib/exporters');

interface WorkspaceShellProps {
  mode: OutputMode;
  files: UploadedFile[];
  result: string | null;
  isLoading: boolean;
  knowledgeLevel: number;
  generationKey: number;
  onBack: () => void;
  onRegenerate: () => void;
  onSwitchMode: (modeId: string) => void;
}

const RELATED_MODES = ['flashcards', 'active-recall', 'cheat-sheet', 'mind-map', 'infographic', 'comic-strip', 'executive-summary', 'timeline'];

const INTERACTIVE_MODES: Record<string, 'flashcards' | 'quiz' | 'timeline' | 'mindmap' | 'comic' | 'infographic' | 'slides'> = {
  'flashcards': 'flashcards',
  'active-recall': 'quiz',
  'exam-prep': 'quiz',
  'timeline': 'timeline',
  'mind-map': 'mindmap',
  'comic-strip': 'comic',
  'infographic': 'infographic',
  'slide-deck': 'slides',
};

const VISUAL_ONLY_MODES = new Set(['comic-strip', 'infographic', 'slide-deck']);

export function WorkspaceShell({
  mode, files, result, isLoading, knowledgeLevel, generationKey, onBack, onRegenerate, onSwitchMode,
}: WorkspaceShellProps) {
  const [title, setTitle] = useState(`${mode.label} – Workspace`);
  const [editingTitle, setEditingTitle] = useState(false);
  const [search, setSearch] = useState('');
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);

  const interactiveKind = INTERACTIVE_MODES[mode.id];
  const isVisualOnly = VISUAL_ONLY_MODES.has(mode.id);
  const [view, setView] = useState<'interactive' | 'document'>(interactiveKind ? 'interactive' : 'document');

  const toc = useMemo(() => extractToc(result ?? ''), [result]);
  const Icon = mode.icon;
  const levelLabel = knowledgeLevel < 33 ? 'Beginner' : knowledgeLevel < 66 ? 'Intermediate' : 'Expert';

  const handleCopy = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(result);
    toast.success('Copied to clipboard');
  };

  type ExportKind = 'md' | 'txt' | 'pdf' | 'docx' | 'pptx';
  const handleExport = async (kind: ExportKind) => {
    if (!result) return;
    try {
      const t = title;
      const ex = await loadExporters();
      if (kind === 'md') ex.exportMarkdown(result, t);
      else if (kind === 'txt') ex.exportTxt(result, t);
      else if (kind === 'pdf') ex.exportPdf(result, t);
      else if (kind === 'docx') await ex.exportDocx(result, t);
      else if (kind === 'pptx') await ex.exportPptx(result, t);
      toast.success(`Exported as .${kind}`);
    } catch (e) {
      console.error(e);
      toast.error(`Export failed`);
    }
  };

  const handleShare = async () => {
    await navigator.clipboard.writeText(window.location.href);
    toast.success('Workspace link copied');
  };

  const related = RELATED_MODES.filter(id => id !== mode.id).map(getModeById).filter(Boolean).slice(0, 4) as OutputMode[];

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-background">
      {/* Toolbar */}
      <div className="h-14 border-b border-border bg-card/50 backdrop-blur-sm flex items-center gap-2 px-3 shrink-0">
        <Button variant="ghost" size="icon" onClick={onBack} aria-label="Back">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => setLeftOpen(v => !v)} aria-label="Toggle sources">
          <ChevronLeft className={`w-4 h-4 transition-transform ${!leftOpen ? 'rotate-180' : ''}`} />
        </Button>

        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Icon className="w-4 h-4 text-accent shrink-0" />
          {editingTitle ? (
            <Input
              autoFocus value={title}
              onChange={e => setTitle(e.target.value)}
              onBlur={() => setEditingTitle(false)}
              onKeyDown={e => { if (e.key === 'Enter') setEditingTitle(false); }}
              className="h-8 max-w-md"
            />
          ) : (
            <button onClick={() => setEditingTitle(true)} className="font-display font-semibold text-sm truncate hover:text-accent transition-colors" title="Click to rename">
              {title}
            </button>
          )}
          <span className="hidden sm:inline-flex text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
            {levelLabel}
          </span>
        </div>

        {interactiveKind && !isVisualOnly && result && (
          <div className="hidden sm:inline-flex items-center rounded-md border border-border p-0.5 mr-1">
            <button
              onClick={() => setView('interactive')}
              className={cn('px-2 py-1 text-xs rounded gap-1 inline-flex items-center', view === 'interactive' ? 'bg-accent/15 text-accent' : 'text-muted-foreground')}
            >
              <LayoutGrid className="w-3 h-3" /> Interactive
            </button>
            <button
              onClick={() => setView('document')}
              className={cn('px-2 py-1 text-xs rounded gap-1 inline-flex items-center', view === 'document' ? 'bg-accent/15 text-accent' : 'text-muted-foreground')}
            >
              <Eye className="w-3 h-3" /> Document
            </button>
          </div>
        )}

        <div className="hidden md:flex relative max-w-xs flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search workspace…" className="h-8 pl-8 text-sm" />
        </div>

        <Button variant="ghost" size="sm" onClick={handleCopy} disabled={!result} className="gap-1.5">
          <Copy className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Copy</span>
        </Button>

        <Button variant="ghost" size="sm" onClick={handleCopy} disabled={!result || isVisualOnly} className="gap-1.5">
          <Copy className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Copy</span>
        </Button>

        {!isVisualOnly && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" disabled={!result} className="gap-1.5">
                <Download className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Export</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem onClick={() => handleExport('pdf')}>PDF document (.pdf)</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('docx')}>Word document (.docx)</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('pptx')}>PowerPoint deck (.pptx)</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleExport('md')}>Markdown (.md)</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('txt')}>Plain text (.txt)</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        <Button variant="ghost" size="sm" onClick={handleShare} className="gap-1.5">
          <Share2 className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Share</span>
        </Button>

        <Button variant="ghost" size="icon" onClick={() => setRightOpen(v => !v)} aria-label="Toggle actions">
          <ChevronRight className={`w-4 h-4 transition-transform ${!rightOpen ? 'rotate-180' : ''}`} />
        </Button>
      </div>

      {/* Three-pane body */}
      <ResizablePanelGroup direction="horizontal" className="flex-1 min-h-0">
        {leftOpen && (
          <>
            <ResizablePanel defaultSize={18} minSize={14} maxSize={28} className="hidden md:block">
              <LeftSidebar files={files} />
            </ResizablePanel>
            <ResizableHandle className="hidden md:flex" />
          </>
        )}

        <ResizablePanel defaultSize={rightOpen && leftOpen ? 60 : 75}>
          <CenterPanel
            isLoading={isLoading}
            result={result}
            mode={mode}
            toc={toc}
            view={view}
            interactiveKind={interactiveKind}
            files={files}
            knowledgeLevel={knowledgeLevel}
            generationKey={generationKey}
          />
        </ResizablePanel>

        {rightOpen && (
          <>
            <ResizableHandle className="hidden lg:flex" />
            <ResizablePanel defaultSize={22} minSize={16} maxSize={32} className="hidden lg:block">
              <RightSidebar
                mode={mode}
                onRegenerate={onRegenerate}
                onSwitchMode={onSwitchMode}
                related={related}
                onCopy={handleCopy}
                onExport={handleExport}
                disabled={!result || isLoading}
              />
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>
    </div>
  );
}

function LeftSidebar({ files }: { files: UploadedFile[] }) {
  return (
    <aside className="h-full overflow-y-auto bg-card/30 border-r border-border p-4 space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Sources</p>
        <ul className="space-y-1.5">
          {files.map(f => (
            <li key={f.id} className="flex items-start gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors text-sm" title={f.file.name}>
              <FileText className="w-4 h-4 text-accent mt-0.5 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-foreground">{f.tag}</p>
                <p className="text-[11px] text-muted-foreground truncate">{f.file.name}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Collections</p>
        <p className="text-xs text-muted-foreground italic px-2">Group related workspaces (coming soon)</p>
      </div>
    </aside>
  );
}

function CenterPanel({
  isLoading, result, mode, toc, view, interactiveKind, files, knowledgeLevel, generationKey,
}: {
  isLoading: boolean;
  result: string | null;
  mode: OutputMode;
  toc: ReturnType<typeof extractToc>;
  view: 'interactive' | 'document';
  interactiveKind?: 'flashcards' | 'quiz' | 'timeline' | 'mindmap' | 'comic' | 'infographic' | 'slides';
  files: UploadedFile[];
  knowledgeLevel: number;
  generationKey: number;
}) {
  const isVisualKind = interactiveKind === 'comic' || interactiveKind === 'infographic' || interactiveKind === 'slides';
  const showInteractive = view === 'interactive' && interactiveKind && (isVisualKind || (result && !isLoading));
  const showToc = view === 'document' && !interactiveKind && toc.length > 0;

  return (
    <div className="h-full overflow-y-auto">
      <div className={cn(
        'mx-auto px-6 lg:px-10 py-10 gap-10',
        showToc ? 'max-w-[1100px] grid grid-cols-1 xl:grid-cols-[1fr_220px]' : 'max-w-[1100px]'
      )}>
        <div className="min-w-0">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={cn(!showInteractive && 'max-w-[850px] mx-auto')}>
            {showInteractive ? (
              <Suspense fallback={<div className="flex items-center justify-center py-32"><Loader2 className="w-6 h-6 animate-spin text-accent" /></div>}>
                {interactiveKind === 'comic' ? <ComicStripView files={files} knowledgeLevel={knowledgeLevel} generationKey={generationKey} /> :
                 interactiveKind === 'infographic' ? <InfographicView files={files} knowledgeLevel={knowledgeLevel} generationKey={generationKey} /> :
                 interactiveKind === 'slides' ? <SlideDeckView files={files} knowledgeLevel={knowledgeLevel} generationKey={generationKey} /> :
                 interactiveKind === 'flashcards' ? <FlashcardsView content={result!} /> :
                 interactiveKind === 'quiz' ? <QuizView content={result!} /> :
                 interactiveKind === 'timeline' ? <TimelineView content={result!} /> :
                 interactiveKind === 'mindmap' ? <MindMapView content={result!} /> : null}
              </Suspense>
            ) : isLoading && !result ? (
              <div className="flex flex-col items-center justify-center py-32 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-accent" />
                <p className="text-sm text-muted-foreground">Generating {mode.label.toLowerCase()}…</p>
              </div>
            ) : result ? (
              <DocumentRenderer content={result} isStreaming={isLoading} />
            ) : (
              <div className="flex items-center justify-center py-32 text-muted-foreground text-sm">
                Something went wrong. Please try again.
              </div>
            )}
          </motion.div>
        </div>
        {showToc && (
          <aside className="hidden xl:block">
            <div className="sticky top-6">
              <TableOfContents items={toc} />
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}

function RightSidebar({
  mode, onRegenerate, onSwitchMode, related, onCopy, onExport, disabled,
}: {
  mode: OutputMode;
  onRegenerate: () => void;
  onSwitchMode: (id: string) => void;
  related: OutputMode[];
  onCopy: () => void;
  onExport: (k: 'md' | 'txt' | 'pdf' | 'docx' | 'pptx') => void;
  disabled: boolean;
}) {
  return (
    <aside className="h-full overflow-y-auto bg-card/30 border-l border-border p-4 space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Actions</p>
        <div className="space-y-1.5">
          <Button variant="outline" size="sm" className="w-full justify-start gap-2" onClick={onRegenerate} disabled={disabled}>
            <RefreshCw className="w-3.5 h-3.5" /> Regenerate
          </Button>
          <Button variant="outline" size="sm" className="w-full justify-start gap-2" onClick={onCopy} disabled={disabled}>
            <Copy className="w-3.5 h-3.5" /> Copy as markdown
          </Button>
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Export Center</p>
        <div className="grid grid-cols-2 gap-1.5">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => onExport('pdf')} disabled={disabled}>
            <Download className="w-3.5 h-3.5" /> PDF
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => onExport('docx')} disabled={disabled}>
            <Download className="w-3.5 h-3.5" /> DOCX
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => onExport('pptx')} disabled={disabled}>
            <Download className="w-3.5 h-3.5" /> PPTX
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => onExport('md')} disabled={disabled}>
            <Download className="w-3.5 h-3.5" /> MD
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5 col-span-2" onClick={() => onExport('txt')} disabled={disabled}>
            <Download className="w-3.5 h-3.5" /> Plain text (.txt)
          </Button>
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Related outputs</p>
        <div className="space-y-1.5">
          {related.map(r => {
            const RIcon = r.icon;
            return (
              <button
                key={r.id}
                onClick={() => onSwitchMode(r.id)}
                className="w-full text-left p-2.5 rounded-lg border border-border hover:border-accent/50 hover:bg-accent/5 transition-all group"
              >
                <div className="flex items-center gap-2">
                  <RIcon className="w-3.5 h-3.5 text-accent shrink-0" />
                  <span className="text-xs font-medium truncate">{r.label}</span>
                  <Sparkles className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 text-accent transition-opacity" />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="pt-2 border-t border-border">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Check className="w-3.5 h-3.5 text-emerald-500" />
          <span>Files auto-delete after session</span>
        </div>
      </div>
    </aside>
  );
}

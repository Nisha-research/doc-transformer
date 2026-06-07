import { useEffect, useMemo, useRef, useState } from 'react';
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove, SortableContext, useSortable, sortableKeyboardCoordinates, verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';
import {
  Download, Loader2, Plus, Trash2, GripVertical, RefreshCw, Copy, AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { generateSlides, type Slide, type SlideDeck, type SlideLayout } from '@/lib/slides-api';
import { exportDeckAsPptx, newSlide } from '@/lib/slide-export';
import { extractTextFromFiles } from '@/lib/ai-stream';
import type { UploadedFile } from '@/lib/file-utils';
import { cn } from '@/lib/utils';

interface Props {
  files: UploadedFile[];
  knowledgeLevel: number;
  generationKey: number;
}

const LAYOUTS: SlideLayout[] = ['title', 'section', 'bullets', 'two-column', 'stat', 'quote', 'conclusion'];

export function SlideDeckView({ files, knowledgeLevel, generationKey }: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deck, setDeck] = useState<SlideDeck | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const lastKey = useRef<number | null>(null);

  useEffect(() => {
    if (lastKey.current === generationKey) return;
    lastKey.current = generationKey;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      setDeck(null);
      try {
        const text = await extractTextFromFiles(files.map(f => ({ file: f.file, tag: f.tag })));
        const spec = await generateSlides({
          documentText: text,
          knowledgeLevel,
          fileTags: files.map(f => f.tag),
          slideCount: 10,
        });
        if (cancelled) return;
        const slides = (spec.slides || []).map((s, i) => ({
          ...s,
          id: s.id || `slide-${i}-${Math.random().toString(36).slice(2, 7)}`,
        }));
        const first = slides[0]?.id ?? null;
        setDeck({ ...spec, slides });
        setActiveId(first);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Generation failed');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [generationKey, files, knowledgeLevel]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const active = useMemo(
    () => deck?.slides.find(s => s.id === activeId) ?? deck?.slides[0] ?? null,
    [deck, activeId],
  );

  function updateSlide(id: string, patch: Partial<Slide>) {
    setDeck(d => d ? { ...d, slides: d.slides.map(s => s.id === id ? { ...s, ...patch } : s) } : d);
  }

  function handleDragEnd(e: DragEndEvent) {
    if (!deck || !e.over || e.active.id === e.over.id) return;
    const ids = deck.slides.map(s => s.id!);
    const from = ids.indexOf(String(e.active.id));
    const to = ids.indexOf(String(e.over.id));
    if (from < 0 || to < 0) return;
    setDeck({ ...deck, slides: arrayMove(deck.slides, from, to) });
  }

  function addSlide() {
    if (!deck) return;
    const s = newSlide('bullets');
    const idx = deck.slides.findIndex(x => x.id === activeId);
    const slides = [...deck.slides];
    slides.splice(idx >= 0 ? idx + 1 : slides.length, 0, s);
    setDeck({ ...deck, slides });
    setActiveId(s.id!);
  }

  function deleteSlide(id: string) {
    if (!deck || deck.slides.length <= 1) return;
    const idx = deck.slides.findIndex(s => s.id === id);
    const slides = deck.slides.filter(s => s.id !== id);
    setDeck({ ...deck, slides });
    if (activeId === id) setActiveId(slides[Math.max(0, idx - 1)]?.id ?? slides[0]?.id ?? null);
  }

  function duplicateSlide(id: string) {
    if (!deck) return;
    const idx = deck.slides.findIndex(s => s.id === id);
    if (idx < 0) return;
    const copy: Slide = { ...deck.slides[idx], id: `slide-${Math.random().toString(36).slice(2, 9)}` };
    const slides = [...deck.slides];
    slides.splice(idx + 1, 0, copy);
    setDeck({ ...deck, slides });
    setActiveId(copy.id!);
  }

  async function handleExport() {
    if (!deck) return;
    try {
      await exportDeckAsPptx(deck);
      toast.success('Exported deck as .pptx');
    } catch (e) {
      console.error(e);
      toast.error('Export failed');
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
        <p className="text-sm text-muted-foreground">Designing slide deck…</p>
      </div>
    );
  }
  if (error || !deck) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3 text-center">
        <AlertCircle className="w-8 h-8 text-destructive" />
        <p className="text-sm text-muted-foreground max-w-md">{error || 'Could not generate slides. Please try again.'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3 pb-3 border-b border-border">
        <div className="min-w-0">
          <Input
            value={deck.title}
            onChange={e => setDeck({ ...deck, title: e.target.value })}
            className="font-display text-2xl font-bold border-0 px-0 h-auto bg-transparent focus-visible:ring-0"
          />
          <Input
            value={deck.subtitle}
            onChange={e => setDeck({ ...deck, subtitle: e.target.value })}
            className="text-sm text-muted-foreground border-0 px-0 h-auto bg-transparent focus-visible:ring-0"
            placeholder="Subtitle"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{deck.slides.length} slides</span>
          <Button size="sm" variant="outline" onClick={addSlide} className="gap-1.5">
            <Plus className="w-3.5 h-3.5" /> Add slide
          </Button>
          <Button size="sm" onClick={handleExport} className="gap-1.5">
            <Download className="w-3.5 h-3.5" /> Export .pptx
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
        {/* Slide rail (drag to reorder) */}
        <aside className="space-y-2 lg:max-h-[70vh] lg:overflow-y-auto pr-1">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={deck.slides.map(s => s.id!)} strategy={verticalListSortingStrategy}>
              {deck.slides.map((s, i) => (
                <SortableThumb
                  key={s.id}
                  slide={s}
                  index={i}
                  isActive={s.id === activeId}
                  theme={deck.theme}
                  onSelect={() => setActiveId(s.id!)}
                  onDuplicate={() => duplicateSlide(s.id!)}
                  onDelete={() => deleteSlide(s.id!)}
                  canDelete={deck.slides.length > 1}
                />
              ))}
            </SortableContext>
          </DndContext>
        </aside>

        {/* Editor + preview */}
        <div className="space-y-4">
          {active && (
            <>
              <SlidePreview slide={active} theme={deck.theme} large />
              <SlideEditor
                slide={active}
                onChange={patch => updateSlide(active.id!, patch)}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function SortableThumb({
  slide, index, isActive, theme, onSelect, onDuplicate, onDelete, canDelete,
}: {
  slide: Slide; index: number; isActive: boolean; theme: SlideDeck['theme'];
  onSelect: () => void; onDuplicate: () => void; onDelete: () => void; canDelete: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: slide.id! });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group relative rounded-lg border bg-card transition-all cursor-pointer overflow-hidden',
        isActive ? 'border-accent ring-2 ring-accent/30' : 'border-border hover:border-accent/40',
      )}
      onClick={onSelect}
    >
      <div className="flex items-stretch">
        <button
          {...attributes} {...listeners}
          className="px-1.5 flex items-center text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing"
          aria-label="Drag to reorder"
          onClick={e => e.stopPropagation()}
        >
          <GripVertical className="w-3.5 h-3.5" />
        </button>
        <div className="flex-1 min-w-0 py-2 pr-2">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono text-muted-foreground tabular-nums">{String(index + 1).padStart(2, '0')}</span>
            <span className="text-[10px] uppercase tracking-wider text-accent font-semibold">{slide.layout}</span>
          </div>
          <SlidePreview slide={slide} theme={theme} />
          <p className="text-xs font-medium mt-1.5 truncate">{slide.title}</p>
        </div>
      </div>
      <div className="absolute top-1 right-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={e => { e.stopPropagation(); onDuplicate(); }}
          className="p-1 rounded bg-background/80 hover:bg-background border border-border"
          title="Duplicate"
        >
          <Copy className="w-3 h-3" />
        </button>
        {canDelete && (
          <button
            onClick={e => { e.stopPropagation(); onDelete(); }}
            className="p-1 rounded bg-background/80 hover:bg-destructive hover:text-destructive-foreground border border-border"
            title="Delete"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
}

function SlidePreview({ slide, theme, large = false }: { slide: Slide; theme: SlideDeck['theme']; large?: boolean }) {
  // 16:9 aspect, scale font sizes for small thumbs vs large preview
  const k = large ? 1 : 0.22;
  const pri = theme.primary;
  const acc = theme.accent;
  const bg = theme.bg;
  const ink = theme.ink;

  const containerStyle = {
    background: slide.layout === 'title' ? pri : bg,
    color: slide.layout === 'title' ? '#fff' : ink,
    aspectRatio: '16/9',
  } as const;

  return (
    <motion.div
      layout
      style={containerStyle}
      className={cn(
        'relative w-full rounded-md overflow-hidden border border-border',
        large && 'shadow-lg',
      )}
    >
      {/* top bar */}
      <div className="absolute top-0 left-0 right-0" style={{ background: pri, height: large ? 8 : 3 }} />

      <div className="absolute inset-0" style={{ padding: large ? 32 : 8 }}>
        {slide.layout === 'title' && (
          <div className="h-full flex flex-col justify-center">
            <div style={{ width: large ? 64 : 14, height: large ? 4 : 1.5, background: acc, marginBottom: large ? 16 : 4 }} />
            <div style={{ fontSize: 48 * k, fontWeight: 800, lineHeight: 1.1 }}>{slide.title}</div>
            {slide.subtitle && <div style={{ fontSize: 18 * k, marginTop: large ? 12 : 3, opacity: 0.85 }}>{slide.subtitle}</div>}
          </div>
        )}
        {slide.layout === 'section' && (
          <div className="h-full flex flex-col justify-center">
            {slide.subtitle && (
              <div style={{ fontSize: 14 * k, color: acc, fontWeight: 700, letterSpacing: 3 * k, textTransform: 'uppercase', marginBottom: large ? 12 : 3 }}>
                {slide.subtitle}
              </div>
            )}
            <div style={{ fontSize: 42 * k, fontWeight: 800, lineHeight: 1.1 }}>{slide.title}</div>
          </div>
        )}
        {slide.layout === 'stat' && (
          <div className="h-full flex flex-col">
            <div style={{ fontSize: 22 * k, fontWeight: 700 }}>{slide.title}</div>
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <div style={{ fontSize: 110 * k, fontWeight: 900, color: acc, lineHeight: 1 }}>{slide.stat?.value}</div>
              <div style={{ fontSize: 18 * k, fontWeight: 700, marginTop: large ? 8 : 2 }}>{slide.stat?.label}</div>
              {slide.stat?.context && <div style={{ fontSize: 14 * k, opacity: 0.7, marginTop: large ? 4 : 1, fontStyle: 'italic' }}>{slide.stat.context}</div>}
            </div>
          </div>
        )}
        {slide.layout === 'quote' && (
          <div className="h-full flex flex-col justify-center">
            <div style={{ fontSize: 120 * k, color: acc, lineHeight: 0.6, fontFamily: 'Georgia, serif' }}>"</div>
            <div style={{ fontSize: 22 * k, fontStyle: 'italic', fontFamily: 'Georgia, serif', marginTop: large ? -12 : -3 }}>{slide.quote?.text || slide.title}</div>
            {slide.quote?.author && <div style={{ fontSize: 14 * k, opacity: 0.6, marginTop: large ? 12 : 3, textAlign: 'right' }}>— {slide.quote.author}</div>}
          </div>
        )}
        {slide.layout === 'two-column' && (
          <div className="h-full flex flex-col">
            <div style={{ fontSize: 24 * k, fontWeight: 800 }}>{slide.title}</div>
            <div style={{ width: large ? 48 : 10, height: large ? 4 : 1.5, background: acc, margin: `${large ? 8 : 2}px 0 ${large ? 16 : 4}px` }} />
            <div className="grid grid-cols-2 gap-2 flex-1" style={{ gap: large ? 16 : 4 }}>
              {(slide.columns || []).slice(0, 2).map((c, i) => (
                <div key={i} className="rounded" style={{ background: '#fff', padding: large ? 16 : 4, border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: 16 * k, fontWeight: 700, color: pri, marginBottom: large ? 6 : 1 }}>{c.heading}</div>
                  <div style={{ fontSize: 13 * k, color: ink, lineHeight: 1.4 }}>{c.body}</div>
                </div>
              ))}
            </div>
          </div>
        )}
        {(slide.layout === 'bullets' || slide.layout === 'conclusion') && (
          <div className="h-full flex flex-col">
            {(slide.layout === 'conclusion' || slide.subtitle) && (
              <div style={{ fontSize: 12 * k, color: acc, fontWeight: 700, letterSpacing: 3 * k, textTransform: 'uppercase' }}>
                {slide.layout === 'conclusion' ? 'Key Takeaways' : slide.subtitle}
              </div>
            )}
            <div style={{ fontSize: 26 * k, fontWeight: 800, marginTop: large ? 6 : 1 }}>{slide.title}</div>
            <div style={{ width: large ? 48 : 10, height: large ? 4 : 1.5, background: acc, margin: `${large ? 8 : 2}px 0 ${large ? 16 : 4}px` }} />
            <ul className="space-y-1" style={{ fontSize: 16 * k, lineHeight: 1.4 }}>
              {(slide.bullets || []).slice(0, 6).map((b, i) => (
                <li key={i} className="flex gap-2">
                  <span style={{ color: acc, fontWeight: 800 }}>●</span><span>{b}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function SlideEditor({ slide, onChange }: { slide: Slide; onChange: (p: Partial<Slide>) => void }) {
  return (
    <div className="rounded-lg border border-border bg-card/40 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Edit slide</p>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5">
              <RefreshCw className="w-3 h-3" /> Layout: <span className="font-mono">{slide.layout}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {LAYOUTS.map(L => (
              <DropdownMenuItem key={L} onClick={() => onChange({ layout: L })}>{L}</DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2">
          <label className="text-xs text-muted-foreground">Title</label>
          <Input value={slide.title} onChange={e => onChange({ title: e.target.value })} />
        </div>
        <div className="sm:col-span-2">
          <label className="text-xs text-muted-foreground">Subtitle / eyebrow</label>
          <Input value={slide.subtitle ?? ''} onChange={e => onChange({ subtitle: e.target.value })} />
        </div>

        {(slide.layout === 'bullets' || slide.layout === 'conclusion') && (
          <div className="sm:col-span-2">
            <label className="text-xs text-muted-foreground">Bullets (one per line)</label>
            <Textarea
              rows={6}
              value={(slide.bullets || []).join('\n')}
              onChange={e => onChange({ bullets: e.target.value.split('\n').map(s => s.trim()).filter(Boolean) })}
            />
          </div>
        )}

        {slide.layout === 'two-column' && (slide.columns || [{ heading: '', body: '' }, { heading: '', body: '' }]).slice(0, 2).map((c, i) => (
          <div key={i} className="space-y-2">
            <label className="text-xs text-muted-foreground">Column {i + 1}</label>
            <Input
              value={c.heading}
              placeholder="Heading"
              onChange={e => {
                const cols = [...(slide.columns || [{ heading: '', body: '' }, { heading: '', body: '' }])];
                cols[i] = { ...cols[i], heading: e.target.value };
                onChange({ columns: cols });
              }}
            />
            <Textarea
              rows={4} value={c.body} placeholder="Body"
              onChange={e => {
                const cols = [...(slide.columns || [{ heading: '', body: '' }, { heading: '', body: '' }])];
                cols[i] = { ...cols[i], body: e.target.value };
                onChange({ columns: cols });
              }}
            />
          </div>
        ))}

        {slide.layout === 'stat' && (
          <>
            <div>
              <label className="text-xs text-muted-foreground">Value</label>
              <Input value={slide.stat?.value ?? ''} onChange={e => onChange({ stat: { ...(slide.stat || { label: '' }), value: e.target.value } })} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Label</label>
              <Input value={slide.stat?.label ?? ''} onChange={e => onChange({ stat: { ...(slide.stat || { value: '' }), label: e.target.value } })} />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs text-muted-foreground">Context (optional)</label>
              <Input value={slide.stat?.context ?? ''} onChange={e => onChange({ stat: { ...(slide.stat || { value: '', label: '' }), context: e.target.value } })} />
            </div>
          </>
        )}

        {slide.layout === 'quote' && (
          <>
            <div className="sm:col-span-2">
              <label className="text-xs text-muted-foreground">Quote</label>
              <Textarea rows={3} value={slide.quote?.text ?? ''} onChange={e => onChange({ quote: { ...(slide.quote || {}), text: e.target.value } })} />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs text-muted-foreground">Author</label>
              <Input value={slide.quote?.author ?? ''} onChange={e => onChange({ quote: { ...(slide.quote || { text: '' }), author: e.target.value } })} />
            </div>
          </>
        )}

        <div className="sm:col-span-2">
          <label className="text-xs text-muted-foreground">Speaker notes</label>
          <Textarea rows={3} value={slide.notes ?? ''} onChange={e => onChange({ notes: e.target.value })} />
        </div>
      </div>
    </div>
  );
}

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Download, FileImage, FileText, Code2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { type UploadedFile } from '@/lib/file-utils';
import { extractTextFromFiles } from '@/lib/ai-stream';
import { generateVisual, type ComicResult } from '@/lib/visual-api';
import { exportComicAsHtml, exportElementAsPdf, exportElementAsPng } from '@/lib/visual-exporters';
import { toast } from 'sonner';

interface Props {
  files: UploadedFile[];
  knowledgeLevel: number;
  generationKey: number;
}

export function ComicStripView({ files, knowledgeLevel, generationKey }: Props) {
  const [data, setData] = useState<ComicResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  const run = async () => {
    setLoading(true); setError(null); setData(null);
    try {
      const documentText = await extractTextFromFiles(files.map(f => ({ file: f.file, tag: f.tag })));
      const res = await generateVisual<ComicResult>({
        kind: 'comic-strip',
        documentText, knowledgeLevel,
        fileTags: files.map(f => f.tag),
      });
      setData(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Generation failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { run(); /* eslint-disable-next-line */ }, [generationKey]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-accent" />
        <p className="text-sm text-muted-foreground">Drawing your comic book… (this takes ~20-40s)</p>
        <p className="text-xs text-muted-foreground/70">Writing panels and illustrating each scene in parallel</p>
      </div>
    );
  }
  if (error || !data) {
    return (
      <div className="rounded-xl border border-dashed border-destructive/40 p-10 text-center">
        <p className="text-sm text-destructive mb-3">{error || 'No comic generated'}</p>
        <Button onClick={run} size="sm" variant="outline"><RefreshCw className="w-3.5 h-3.5 mr-2" />Try again</Button>
      </div>
    );
  }

  const handleExport = async (kind: 'png' | 'pdf' | 'html') => {
    try {
      if (kind === 'html') exportComicAsHtml(data);
      else if (stageRef.current) {
        if (kind === 'png') await exportElementAsPng(stageRef.current, `${data.title}-comic`);
        else await exportElementAsPdf(stageRef.current, `${data.title}-comic`);
      }
      toast.success(`Exported as .${kind}`);
    } catch (e) { console.error(e); toast.error('Export failed'); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Comic Book · {data.style}</p>
          <h2 className="text-xl font-display font-bold">{data.title}</h2>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={run}><RefreshCw className="w-3.5 h-3.5 mr-1.5" />Redraw</Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" className="gap-1.5"><Download className="w-3.5 h-3.5" />Export</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleExport('pdf')}><FileText className="w-4 h-4 mr-2" />PDF</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('png')}><FileImage className="w-4 h-4 mr-2" />PNG image</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('html')}><Code2 className="w-4 h-4 mr-2" />Interactive HTML</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div
        ref={stageRef}
        className="rounded-2xl bg-[#f5f1e8] dark:bg-[#1c1a17] p-6 md:p-8 border-4 border-foreground/90"
        style={{ boxShadow: '8px 8px 0 hsl(var(--foreground) / 0.85)' }}
      >
        <div className="text-center mb-6">
          <h3 className="font-serif text-3xl md:text-4xl font-bold text-[#1a1a1a] dark:text-[#f5f1e8] tracking-tight">{data.title}</h3>
          {data.subtitle && <p className="italic text-sm text-[#5a5a5a] dark:text-[#aaa] mt-1">{data.subtitle}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {data.panels.map((p, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="bg-white dark:bg-[#222] border-[3px] border-foreground rounded-lg overflow-hidden"
              style={{ boxShadow: '5px 5px 0 hsl(var(--foreground))' }}
            >
              <div className="relative aspect-square bg-muted">
                {p.image ? (
                  <img src={p.image} alt={p.title} className="w-full h-full object-cover" crossOrigin="anonymous" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">image unavailable</div>
                )}
                {p.dialogue && (
                  <div
                    className="absolute top-3 left-3 max-w-[65%] bg-white text-black border-[2.5px] border-black rounded-2xl px-3 py-1.5 text-sm font-bold"
                    style={{ fontFamily: '"Comic Sans MS", system-ui, sans-serif', boxShadow: '3px 3px 0 #000' }}
                  >
                    {p.dialogue}
                  </div>
                )}
              </div>
              <div className="border-t-[3px] border-foreground p-3 bg-white dark:bg-[#1f1f1f]">
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-red-600 mb-1">
                  Panel {i + 1} · {p.title}
                </p>
                <p className="text-sm leading-snug text-[#1a1a1a] dark:text-[#eee]">{p.caption}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

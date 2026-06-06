import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Loader2, Download, FileImage, FileText, Code2, RefreshCw,
  Zap, Shield, TrendingUp, Brain, Globe, Users, Lightbulb, Target, Rocket, BarChart3, Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { type UploadedFile } from '@/lib/file-utils';
import { extractTextFromFiles } from '@/lib/ai-stream';
import { generateVisual, type InfographicResult } from '@/lib/visual-api';
import { exportInfographicAsHtml, exportElementAsPdf, exportElementAsPng } from '@/lib/visual-exporters';
import { toast } from 'sonner';

const ICONS: Record<string, any> = {
  zap: Zap, shield: Shield, 'trending-up': TrendingUp, brain: Brain, globe: Globe,
  users: Users, lightbulb: Lightbulb, target: Target, rocket: Rocket, chart: BarChart3,
};

interface Props {
  files: UploadedFile[];
  knowledgeLevel: number;
  generationKey: number;
}

export function InfographicView({ files, knowledgeLevel, generationKey }: Props) {
  const [data, setData] = useState<InfographicResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  const run = async () => {
    setLoading(true); setError(null); setData(null);
    try {
      const documentText = await extractTextFromFiles(files.map(f => ({ file: f.file, tag: f.tag })));
      const res = await generateVisual<InfographicResult>({
        kind: 'infographic',
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
        <p className="text-sm text-muted-foreground">Designing your infographic…</p>
      </div>
    );
  }
  if (error || !data) {
    return (
      <div className="rounded-xl border border-dashed border-destructive/40 p-10 text-center">
        <p className="text-sm text-destructive mb-3">{error || 'No infographic generated'}</p>
        <Button onClick={run} size="sm" variant="outline"><RefreshCw className="w-3.5 h-3.5 mr-2" />Try again</Button>
      </div>
    );
  }

  const p = data.palette || { primary: '#0F172A', secondary: '#6366F1', accent: '#F59E0B', bg: '#F8FAFC' };

  const handleExport = async (kind: 'png' | 'pdf' | 'html') => {
    try {
      if (kind === 'html') exportInfographicAsHtml(data);
      else if (stageRef.current) {
        if (kind === 'png') await exportElementAsPng(stageRef.current, `${data.title}-infographic`);
        else await exportElementAsPdf(stageRef.current, `${data.title}-infographic`);
      }
      toast.success(`Exported as .${kind}`);
    } catch (e) { console.error(e); toast.error('Export failed'); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Visual Infographic</p>
          <h2 className="text-xl font-display font-bold">{data.title}</h2>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={run}><RefreshCw className="w-3.5 h-3.5 mr-1.5" />Redesign</Button>
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
        className="rounded-3xl p-8 md:p-12 border border-border overflow-hidden"
        style={{ background: p.bg, color: '#0f172a' }}
      >
        <motion.h1
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-5xl font-display font-extrabold tracking-tight leading-[1.05] mb-3"
          style={{ color: p.primary }}
        >
          {data.title}
        </motion.h1>
        <p className="text-lg md:text-xl text-slate-600 mb-8 max-w-2xl">{data.subtitle}</p>

        <motion.div
          initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}
          className="rounded-2xl p-6 md:p-7 mb-10 flex gap-3 items-start"
          style={{ background: p.primary, color: '#fff' }}
        >
          <Sparkles className="w-6 h-6 shrink-0 mt-0.5" style={{ color: p.accent }} />
          <p className="text-lg md:text-xl font-semibold leading-snug">{data.takeaway}</p>
        </motion.div>

        {data.stats?.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
            {data.stats.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.06 }}
                className="rounded-2xl p-5 bg-white border-2"
                style={{ borderColor: `${p.accent}33` }}
              >
                <div className="text-4xl md:text-5xl font-extrabold leading-none mb-2" style={{ color: p.accent }}>{s.value}</div>
                <div className="text-sm font-semibold text-slate-900 mb-1">{s.label}</div>
                {s.description && <div className="text-xs text-slate-500 leading-snug">{s.description}</div>}
              </motion.div>
            ))}
          </div>
        )}

        <div className="grid gap-4">
          {data.sections.map((s, i) => {
            const Icon = ICONS[s.icon || ''] || Lightbulb;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.06 }}
                className="rounded-xl p-5 md:p-6 bg-white flex gap-4 items-start border-l-[6px]"
                style={{ borderLeftColor: p.secondary }}
              >
                <div className="rounded-xl p-2.5 shrink-0" style={{ background: `${p.secondary}1A`, color: p.secondary }}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-lg md:text-xl font-bold mb-1" style={{ color: p.primary }}>{s.heading}</h3>
                  <p className="text-slate-700 leading-relaxed text-sm md:text-base">{s.body}</p>
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="mt-10 pt-6 border-t border-slate-200 text-center text-xs text-slate-400">
          Generated by StudyForge
        </div>
      </div>
    </div>
  );
}

import { motion } from 'framer-motion';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { type OutputMode } from '@/lib/output-modes';

interface ResultsViewProps {
  mode: OutputMode;
  knowledgeLevel: number;
  isLoading: boolean;
  result: string | null;
  onBack: () => void;
}

export function ResultsView({ mode, knowledgeLevel, isLoading, result, onBack }: ResultsViewProps) {
  const Icon = mode.icon;
  const levelLabel = knowledgeLevel < 33 ? 'Beginner' : knowledgeLevel < 66 ? 'Intermediate' : 'Expert';

  return (
    <section className="container mx-auto px-4 py-8 max-w-3xl">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-2">
            <Icon className="w-5 h-5 text-student" />
            <h2 className="text-xl font-display font-bold text-foreground">{mode.label}</h2>
          </div>
          <span className="ml-auto text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">{levelLabel}</span>
        </div>

        <div className="rounded-xl bg-card border border-border shadow-soft p-6 min-h-[300px]">
          {isLoading && !result ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-student" />
              <p className="text-sm text-muted-foreground">Generating {mode.label.toLowerCase()}...</p>
            </div>
          ) : result ? (
            <div className="prose prose-sm max-w-none text-foreground whitespace-pre-wrap">
              {result}
              {isLoading && <span className="inline-block w-2 h-4 bg-student animate-pulse ml-1" />}
            </div>
          ) : (
            <div className="flex items-center justify-center py-20 text-muted-foreground text-sm">
              Something went wrong. Please try again.
            </div>
          )}
        </div>
      </motion.div>
    </section>
  );
}

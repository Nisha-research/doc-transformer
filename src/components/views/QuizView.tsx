import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, X, Trophy, RotateCw, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { parseQuiz } from '@/lib/parsers';
import { cn } from '@/lib/utils';

export function QuizView({ content }: { content: string }) {
  const questions = useMemo(() => parseQuiz(content), [content]);
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<Record<string, number>>({});
  const [done, setDone] = useState(false);

  if (!questions.length) {
    return (
      <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
        Couldn't detect MCQs. Showing the markdown output instead.
      </div>
    );
  }

  const q = questions[i];
  const userAnswer = picked[q.id];
  const answered = userAnswer !== undefined;

  const choose = (idx: number) => {
    if (answered) return;
    setPicked((prev) => ({ ...prev, [q.id]: idx }));
  };
  const next = () => {
    if (i < questions.length - 1) setI(i + 1);
    else setDone(true);
  };
  const reset = () => { setPicked({}); setI(0); setDone(false); };

  const score = questions.reduce((acc, qq) => {
    const a = picked[qq.id];
    return a !== undefined && qq.options[a]?.correct ? acc + 1 : acc;
  }, 0);

  if (done) {
    const pct = Math.round((score / questions.length) * 100);
    return (
      <div className="text-center py-12 space-y-6">
        <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring' }} className="inline-flex w-20 h-20 rounded-full bg-accent/15 items-center justify-center">
          <Trophy className="w-10 h-10 text-accent" />
        </motion.div>
        <div>
          <div className="text-5xl font-display font-bold">{score}<span className="text-2xl text-muted-foreground"> / {questions.length}</span></div>
          <p className="text-sm text-muted-foreground mt-1">{pct}% correct</p>
        </div>
        <div className="max-w-md mx-auto space-y-2 text-left">
          {questions.map((qq, idx) => {
            const a = picked[qq.id];
            const correct = a !== undefined && qq.options[a]?.correct;
            return (
              <div key={qq.id} className="flex items-start gap-2 text-sm p-2 rounded-lg border border-border">
                {correct ? <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" /> : <X className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />}
                <span className="text-muted-foreground">Q{idx + 1}.</span>
                <span className="flex-1 line-clamp-1">{qq.question}</span>
              </div>
            );
          })}
        </div>
        <Button onClick={reset} className="gap-2"><RotateCw className="w-4 h-4" /> Retake quiz</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
          <span>{q.topic ?? 'Quiz'}</span>
          <span>Question {i + 1} of {questions.length}</span>
        </div>
        <Progress value={((i + (answered ? 1 : 0)) / questions.length) * 100} className="h-1.5" />
      </div>

      <motion.div key={q.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-border bg-card p-6 md:p-8">
        <h3 className="text-lg md:text-xl font-display font-semibold leading-snug mb-6">{q.question}</h3>
        <div className="space-y-2">
          {q.options.map((opt, idx) => {
            const isPicked = userAnswer === idx;
            const showCorrect = answered && opt.correct;
            const showWrong = answered && isPicked && !opt.correct;
            return (
              <button
                key={idx}
                onClick={() => choose(idx)}
                disabled={answered}
                className={cn(
                  'w-full text-left p-3.5 rounded-xl border transition-all flex items-center gap-3',
                  !answered && 'border-border hover:border-accent/50 hover:bg-accent/5',
                  showCorrect && 'border-emerald-500/50 bg-emerald-500/10',
                  showWrong && 'border-rose-500/50 bg-rose-500/10',
                  answered && !showCorrect && !showWrong && 'border-border opacity-60'
                )}
              >
                <span className={cn(
                  'w-7 h-7 rounded-full border flex items-center justify-center text-xs font-medium shrink-0',
                  showCorrect && 'border-emerald-500 bg-emerald-500 text-white',
                  showWrong && 'border-rose-500 bg-rose-500 text-white',
                  !showCorrect && !showWrong && 'border-border'
                )}>
                  {showCorrect ? <Check className="w-3.5 h-3.5" /> : showWrong ? <X className="w-3.5 h-3.5" /> : String.fromCharCode(65 + idx)}
                </span>
                <span className="flex-1 text-sm">{opt.text}</span>
              </button>
            );
          })}
        </div>
        {answered && q.explanation && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-4 p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Why: </span>{q.explanation}
          </motion.div>
        )}
      </motion.div>

      <div className="flex justify-between items-center">
        <span className="text-xs text-muted-foreground">Score: {score} / {Object.keys(picked).length || '—'}</span>
        <Button onClick={next} disabled={!answered} className="gap-1.5">
          {i === questions.length - 1 ? 'Finish' : 'Next'} <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

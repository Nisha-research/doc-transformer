import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, RotateCw, Shuffle, Check, X, Zap, Snowflake } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { parseFlashcards, type Flashcard } from '@/lib/parsers';

type Rating = 'again' | 'hard' | 'good' | 'easy';

interface Stats {
  rating?: Rating;
  reviewed: boolean;
}

const ratingTone: Record<Rating, string> = {
  again: 'bg-rose-500/15 text-rose-500 border-rose-500/30',
  hard: 'bg-amber-500/15 text-amber-500 border-amber-500/30',
  good: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30',
  easy: 'bg-sky-500/15 text-sky-500 border-sky-500/30',
};

export function FlashcardsView({ content }: { content: string }) {
  const initial = useMemo(() => parseFlashcards(content), [content]);
  const [cards, setCards] = useState<Flashcard[]>(initial);
  const [i, setI] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [stats, setStats] = useState<Record<string, Stats>>({});

  if (!cards.length) {
    return (
      <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
        Couldn't detect flashcards. Showing the markdown output instead.
      </div>
    );
  }

  const card = cards[i];
  const reviewed = Object.values(stats).filter((s) => s.reviewed).length;
  const progress = (reviewed / cards.length) * 100;

  const rate = (r: Rating) => {
    setStats((prev) => ({ ...prev, [card.id]: { rating: r, reviewed: true } }));
    setFlipped(false);
    if (i < cards.length - 1) setI(i + 1);
  };
  const next = () => { setFlipped(false); setI((p) => Math.min(p + 1, cards.length - 1)); };
  const prev = () => { setFlipped(false); setI((p) => Math.max(p - 1, 0)); };
  const shuffle = () => {
    setCards((cs) => [...cs].sort(() => Math.random() - 0.5));
    setI(0); setFlipped(false);
  };
  const reset = () => { setStats({}); setI(0); setFlipped(false); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
            <span>{card.topic ?? 'Flashcards'}</span>
            <span>{reviewed} / {cards.length} reviewed</span>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>
        <div className="flex gap-1.5">
          <Button variant="outline" size="sm" onClick={shuffle} className="gap-1.5"><Shuffle className="w-3.5 h-3.5" /> Shuffle</Button>
          <Button variant="outline" size="sm" onClick={reset} className="gap-1.5"><RotateCw className="w-3.5 h-3.5" /> Reset</Button>
        </div>
      </div>

      <div className="relative h-[340px] [perspective:1500px]">
        <AnimatePresence mode="wait">
          <motion.button
            key={card.id}
            onClick={() => setFlipped((f) => !f)}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 w-full h-full text-left [transform-style:preserve-3d] transition-transform duration-500"
            style={{ transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
          >
            <div className="absolute inset-0 [backface-visibility:hidden] rounded-2xl border border-border bg-card shadow-lg p-8 flex flex-col">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Question · {i + 1}/{cards.length}</div>
              <div className="flex-1 flex items-center justify-center text-xl md:text-2xl font-display text-center leading-relaxed">
                {card.question}
              </div>
              <div className="text-xs text-muted-foreground text-center mt-4">Tap or press Space to flip</div>
            </div>
            <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] rounded-2xl border border-accent/30 bg-gradient-to-br from-accent/5 via-card to-card shadow-lg p-8 flex flex-col">
              <div className="text-[10px] uppercase tracking-wider text-accent mb-2">Answer</div>
              <div className="flex-1 flex items-center justify-center text-lg md:text-xl text-center leading-relaxed">
                {card.answer}
              </div>
            </div>
          </motion.button>
        </AnimatePresence>
      </div>

      {flipped ? (
        <div className="grid grid-cols-4 gap-2">
          {(['again', 'hard', 'good', 'easy'] as Rating[]).map((r) => {
            const Icon = r === 'again' ? X : r === 'hard' ? Snowflake : r === 'good' ? Check : Zap;
            return (
              <button
                key={r}
                onClick={() => rate(r)}
                className={`rounded-xl border ${ratingTone[r]} px-3 py-2.5 flex flex-col items-center gap-1 text-xs font-medium capitalize hover:scale-[1.02] transition-transform`}
              >
                <Icon className="w-4 h-4" />
                {r}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <Button variant="outline" size="sm" onClick={prev} disabled={i === 0} className="gap-1"><ChevronLeft className="w-4 h-4" /> Previous</Button>
          <Button variant="default" size="sm" onClick={() => setFlipped(true)}>Show Answer</Button>
          <Button variant="outline" size="sm" onClick={next} disabled={i === cards.length - 1} className="gap-1">Next <ChevronRight className="w-4 h-4" /></Button>
        </div>
      )}
    </div>
  );
}

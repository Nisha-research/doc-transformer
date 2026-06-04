import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Circle } from 'lucide-react';
import { parseTimeline } from '@/lib/parsers';

export function TimelineView({ content }: { content: string }) {
  const events = useMemo(() => parseTimeline(content), [content]);

  if (!events.length) {
    return (
      <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
        Couldn't detect a timeline. Showing the markdown output instead.
      </div>
    );
  }

  return (
    <div className="relative pl-8">
      <div className="absolute left-3 top-2 bottom-2 w-px bg-gradient-to-b from-accent/60 via-border to-accent/60" />
      <ul className="space-y-6">
        {events.map((e, idx) => (
          <motion.li
            key={e.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.04 }}
            className="relative"
          >
            <span className="absolute -left-[1.45rem] top-1.5 w-3 h-3 rounded-full bg-accent ring-4 ring-background" />
            <div className="rounded-xl border border-border bg-card p-4 hover:border-accent/40 transition-colors">
              <div className="text-xs font-medium text-accent uppercase tracking-wider">{e.date}</div>
              <h4 className="font-display font-semibold text-base mt-1">{e.event}</h4>
              {e.significance && (
                <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{e.significance}</p>
              )}
            </div>
          </motion.li>
        ))}
      </ul>
    </div>
  );
}

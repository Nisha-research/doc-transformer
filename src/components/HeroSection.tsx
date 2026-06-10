import { motion } from 'framer-motion';
import { ArrowDown, Shield, Lock, Sparkles, BookOpen, Network, Presentation, PenTool } from 'lucide-react';
import { Button } from '@/components/ui/button';

const TABS = [
  { icon: BookOpen,      label: 'Learn',     hint: 'Notes · Flashcards · Quiz' },
  { icon: Network,       label: 'Visualize', hint: 'Mind maps · Infographics · Timelines' },
  { icon: Presentation,  label: 'Present',   hint: 'Slide decks · Executive summary' },
  { icon: PenTool,       label: 'Create',    hint: 'Blogs · LinkedIn · Story panels' },
];

export function HeroSection() {
  return (
    <section className="relative pt-32 pb-12 overflow-hidden" aria-labelledby="hero-title">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 left-1/4 w-72 h-72 rounded-full bg-student/10 blur-3xl animate-pulse-glow" />
        <div className="absolute top-40 right-1/4 w-96 h-96 rounded-full bg-researcher/10 blur-3xl animate-pulse-glow" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-64 rounded-full bg-professional/5 blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="text-center max-w-3xl mx-auto"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted text-sm font-medium text-muted-foreground mb-6"
          >
            <Sparkles className="w-4 h-4 text-student" />
            Your AI knowledge studio
          </motion.div>

          <h1 id="hero-title" className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold leading-tight mb-6">
            Turn any document into{' '}
            <span className="text-gradient-hero">study-ready knowledge</span>
          </h1>

          <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-8">
            Upload a PDF, slide deck or notes. Generate mind maps, infographics, flashcards,
            slide decks and executive summaries — in seconds, at your skill level.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
            <Button
              size="lg"
              className="bg-gradient-hero text-primary-foreground hover:opacity-90"
              onClick={() => document.getElementById('upload')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Upload a document
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
            >
              See what it does
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl mx-auto mb-10">
            {TABS.map(({ icon: Icon, label, hint }) => (
              <motion.div
                key={label}
                whileHover={{ y: -2 }}
                className="rounded-xl border border-border bg-card/60 backdrop-blur p-4 text-left shadow-soft"
              >
                <Icon className="w-5 h-5 text-student mb-2" />
                <div className="font-display font-semibold text-sm">{label}</div>
                <div className="text-xs text-muted-foreground mt-1 leading-snug">{hint}</div>
              </motion.div>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground mb-8">
            <div className="flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-professional" />
              <span>Auth-gated &amp; rate-limited</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-creator" />
              <span>Responses cached for cost control</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-researcher" />
              <span>20+ output modes</span>
            </div>
          </div>

          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
          >
            <ArrowDown className="w-5 h-5 mx-auto text-muted-foreground" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

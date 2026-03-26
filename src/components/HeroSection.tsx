import { motion } from 'framer-motion';
import { ArrowDown, Shield, Clock, Sparkles } from 'lucide-react';

export function HeroSection() {
  return (
    <section className="relative pt-32 pb-12 overflow-hidden">
      {/* Background decorative elements */}
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
            AI-powered document intelligence
          </motion.div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold leading-tight mb-6">
            Transform any document into{' '}
            <span className="text-gradient-hero">knowledge</span>
          </h1>

          <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-8">
            Upload PDFs, text files, or presentations and instantly generate study materials, 
            executive summaries, creative content, and more — tailored to your expertise level.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground mb-10">
            <div className="flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-professional" />
              <span>No signup needed</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-creator" />
              <span>Files auto-deleted in 1 hour</span>
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

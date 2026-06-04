import { Clock, Shield, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { useSession } from '@/hooks/use-session';
import { ThemeToggle } from '@/components/ThemeToggle';

export function Navbar() {
  const { timeRemaining, formatTime } = useSession();

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50"
    >
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-hero flex items-center justify-center">
            <Zap className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-display text-xl font-bold text-foreground">StudyForge</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground">
            <Shield className="w-3.5 h-3.5" />
            <span>No login required</span>
          </div>

          {timeRemaining > 0 && (
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted text-xs font-medium text-muted-foreground">
              <Clock className="w-3.5 h-3.5" />
              <span>Auto-delete in {formatTime(timeRemaining)}</span>
            </div>
          )}

          <ThemeToggle />
        </div>
      </div>
    </motion.nav>
  );
}

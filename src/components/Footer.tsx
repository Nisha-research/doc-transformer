import { Zap } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-border py-8">
      <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-gradient-hero flex items-center justify-center">
            <Zap className="w-3 h-3 text-primary-foreground" />
          </div>
          <span className="font-display text-sm font-semibold text-foreground">StudyForge</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Your documents are never stored. Privacy by design.
        </p>
      </div>
    </footer>
  );
}

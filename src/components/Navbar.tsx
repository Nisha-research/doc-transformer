import { Clock, Zap, LogOut, User as UserIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { useSession } from '@/hooks/use-session';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useNavigate } from 'react-router-dom';

export function Navbar() {
  const { timeRemaining, formatTime } = useSession();
  const { user, signOut, isAdmin } = useAuth();
  const navigate = useNavigate();

  const onSignOut = async () => {
    await signOut();
    navigate('/auth', { replace: true });
  };

  const initials = (user?.user_metadata?.display_name || user?.email || 'U')
    .split(/[\s@]+/)[0].slice(0, 2).toUpperCase();

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
          {timeRemaining > 0 && (
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted text-xs font-medium text-muted-foreground">
              <Clock className="w-3.5 h-3.5" />
              <span>Auto-delete in {formatTime(timeRemaining)}</span>
            </div>
          )}

          <ThemeToggle />

          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="rounded-full h-9 px-3 gap-2">
                  <div className="w-6 h-6 rounded-full bg-gradient-hero text-primary-foreground text-xs font-semibold flex items-center justify-center">
                    {initials}
                  </div>
                  <span className="hidden sm:inline text-xs">{user.email}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal text-xs text-muted-foreground">
                  Signed in as<br /><span className="text-foreground font-medium">{user.email}</span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {isAdmin && (
                  <DropdownMenuItem onClick={() => navigate('/admin')}>
                    <UserIcon className="w-4 h-4 mr-2" /> Admin analytics
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={onSignOut} className="text-destructive">
                  <LogOut className="w-4 h-4 mr-2" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </motion.nav>
  );
}

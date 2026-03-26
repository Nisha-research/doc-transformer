import { useState, useCallback, useEffect } from 'react';
import { getOrCreateSession, getSessionTimeRemaining, type SessionData } from '@/lib/session';

export function useSession() {
  const [session, setSession] = useState<SessionData | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(0);

  useEffect(() => {
    const s = getOrCreateSession();
    setSession(s);
    setTimeRemaining(getSessionTimeRemaining());

    const interval = setInterval(() => {
      const remaining = getSessionTimeRemaining();
      setTimeRemaining(remaining);
      if (remaining <= 0) {
        const newSession = getOrCreateSession();
        setSession(newSession);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = useCallback((ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  return { session, timeRemaining, formatTime };
}

import { v4 } from './uuid';

const SESSION_KEY = 'studyforge_session';
const SESSION_EXPIRY_KEY = 'studyforge_session_expiry';
const SESSION_DURATION_MS = 60 * 60 * 1000; // 1 hour

export interface SessionData {
  id: string;
  createdAt: number;
  expiresAt: number;
}

function generateId(): string {
  return v4();
}

export function getOrCreateSession(): SessionData {
  const existing = localStorage.getItem(SESSION_KEY);
  const expiry = localStorage.getItem(SESSION_EXPIRY_KEY);

  if (existing && expiry) {
    const expiresAt = parseInt(expiry, 10);
    if (Date.now() < expiresAt) {
      return {
        id: existing,
        createdAt: expiresAt - SESSION_DURATION_MS,
        expiresAt,
      };
    }
  }

  const now = Date.now();
  const session: SessionData = {
    id: generateId(),
    createdAt: now,
    expiresAt: now + SESSION_DURATION_MS,
  };

  localStorage.setItem(SESSION_KEY, session.id);
  localStorage.setItem(SESSION_EXPIRY_KEY, session.expiresAt.toString());

  return session;
}

export function getSessionTimeRemaining(): number {
  const expiry = localStorage.getItem(SESSION_EXPIRY_KEY);
  if (!expiry) return 0;
  return Math.max(0, parseInt(expiry, 10) - Date.now());
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(SESSION_EXPIRY_KEY);
}

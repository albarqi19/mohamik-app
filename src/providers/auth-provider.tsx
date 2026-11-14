import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';

import { api, type AuthSession, type User } from '@/api';
import { setAuthToken, setUnauthorizedHandler } from '@/api/client';
import { storage } from '@/lib/storage';

const KEY = 'mohamik.session';

type AuthState = {
  status: 'loading' | 'signedOut' | 'signedIn';
  user: User | null;
  hasSeenWelcome: boolean;
  signIn: (session: AuthSession) => Promise<void>;
  signOut: () => Promise<void>;
  markWelcomeSeen: () => void;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [status, setStatus] = useState<AuthState['status']>('loading');
  const [user, setUser] = useState<User | null>(null);
  const [hasSeenWelcome, setHasSeenWelcome] = useState(false);

  const signOut = useCallback(async () => {
    setAuthToken(null);
    setUser(null);
    setStatus('signedOut');
    await storage.remove(KEY);
    api.auth.logout().catch(() => undefined);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => void signOut());
    (async () => {
      const [raw, welcome] = await Promise.all([storage.get(KEY), storage.get('mohamik.welcome')]);
      setHasSeenWelcome(welcome === '1');
      if (raw) {
        try {
          const session = JSON.parse(raw) as AuthSession;
          setAuthToken(session.token);
          setUser(session.user);
          setStatus('signedIn');
          return;
        } catch {
          // جلسة تالفة
        }
      }
      setStatus('signedOut');
    })();
    return () => setUnauthorizedHandler(null);
  }, [signOut]);

  const signIn = useCallback(async (session: AuthSession) => {
    setAuthToken(session.token);
    setUser(session.user);
    setStatus('signedIn');
    await storage.set(KEY, JSON.stringify(session));
  }, []);

  const markWelcomeSeen = useCallback(() => {
    setHasSeenWelcome(true);
    void storage.set('mohamik.welcome', '1');
  }, []);

  const value = useMemo(
    () => ({ status, user, hasSeenWelcome, signIn, signOut, markWelcomeSeen }),
    [status, user, hasSeenWelcome, signIn, signOut, markWelcomeSeen],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

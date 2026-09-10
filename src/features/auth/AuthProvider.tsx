import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import { isSupabaseConfigured } from '@/lib/supabase';

import { getSessionUser, signOut as repositorySignOut, subscribeToAuthChanges } from './repository';
import type { AuthUser } from './types';

interface AuthContextValue {
  /** True once the persisted session has been read (splash can hide). */
  ready: boolean;
  /** False in UI-stub mode (no Supabase env) — route gate stays open. */
  configured: boolean;
  /** Signed-in user, or null when logged out. */
  user: AuthUser | null;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  ready: false,
  configured: false,
  user: null,
  signOut: async () => undefined,
});

/**
 * Owns the session: reads the persisted Supabase session on boot
 * (auto-login on restart) and follows `onAuthStateChange` after that.
 * When Supabase isn't configured, auth screens are unreachable and every
 * consumer sees `configured: false` instead of a crash.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const configured = useMemo(() => isSupabaseConfigured(), []);
  const [ready, setReady] = useState(!configured);
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    if (!configured) return;
    let cancelled = false;
    (async () => {
      try {
        setUser(await getSessionUser());
      } catch {
        // Corrupt/expired storage must never block boot — start logged out.
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    const unsubscribe = subscribeToAuthChanges((next) => {
      if (!cancelled) {
        setUser(next);
        setReady(true);
      }
    });
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [configured]);

  const signOut = useCallback(async () => {
    if (!configured) return;
    await repositorySignOut();
    // Listener flips `user` to null; set it here too so UI never lags.
    setUser(null);
  }, [configured]);

  const value = useMemo<AuthContextValue>(
    () => ({ ready, configured, user, signOut }),
    [ready, configured, user, signOut],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}

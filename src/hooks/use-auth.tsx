import { useState, useEffect, useCallback, useRef, createContext, useContext, type ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  displayName: string | null;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  displayName: null,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [displayName, setDisplayName] = useState<string | null>(null);
  // 가장 마지막으로 요청된 userId를 추적 — 빠른 로그인/아웃 시 stale 응답 무시
  const currentFetchIdRef = useRef<string | null>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      if (session?.user) {
        const userId = session.user.id;
        currentFetchIdRef.current = userId;
        supabase
          .from('profiles')
          .select('display_name')
          .eq('user_id', userId)
          .single()
          .then(({ data, error }) => {
            if (currentFetchIdRef.current !== userId) return; // 더 최신 요청이 있으면 무시
            if (error) {
              console.warn('[auth] displayName 로드 실패:', error.message);
              return;
            }
            setDisplayName(data?.display_name ?? null);
          });
      } else {
        currentFetchIdRef.current = null;
        setDisplayName(null);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, loading, displayName, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

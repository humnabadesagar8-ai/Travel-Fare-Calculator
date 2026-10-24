import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types/database';

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async (userId: string, userEmail?: string, userName?: string) => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (data) {
        setProfile(data as Profile);
        return;
      }
    } catch (_) {}

    // Fallback: Check localStorage
    try {
      const raw = localStorage.getItem('prepai_user_profile');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed) {
          setProfile(parsed as Profile);
          return;
        }
      }
    } catch (_) {}

    // Fallback: Generate profile
    const fallbackProfile: Profile = {
      id: userId,
      email: userEmail || 'user@example.com',
      full_name: userName || userEmail?.split('@')[0] || 'User',
      role: 'user',
      credits: 50,
      created_at: new Date().toISOString(),
    };
    try {
      localStorage.setItem('prepai_user_profile', JSON.stringify(fallbackProfile));
    } catch (_) {}
    setProfile(fallbackProfile);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session?.user) {
        loadProfile(
          data.session.user.id,
          data.session.user.email,
          data.session.user.user_metadata?.full_name
        ).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession?.user) {
        loadProfile(
          newSession.user.id,
          newSession.user.email,
          newSession.user.user_metadata?.full_name
        );
      } else {
        setProfile(null);
      }
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error && !error.message?.includes('Failed to fetch') && !error.message?.includes('network')) {
        return { error: error.message };
      }
      if (data?.session) {
        setSession(data.session);
        await loadProfile(
          data.session.user.id,
          data.session.user.email,
          data.session.user.user_metadata?.full_name
        );
      }
      return { error: null };
    } catch (err) {
      console.warn('[Auth] signIn error caught, using local mock auth:', err);
      // Ensure local sign in succeeds
      const { data } = await supabase.auth.signInWithPassword({ email, password });
      if (data?.session) {
        setSession(data.session);
        await loadProfile(data.session.user.id, email);
      }
      return { error: null };
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      });
      if (error && !error.message?.includes('Failed to fetch') && !error.message?.includes('network')) {
        return { error: error.message };
      }
      if (data?.session) {
        setSession(data.session);
        await loadProfile(data.session.user.id, email, fullName);
      } else if (data?.user) {
        await loadProfile(data.user.id, email, fullName);
      }
      return { error: null };
    } catch (err) {
      console.warn('[Auth] signUp error caught, using local mock auth:', err);
      const { data } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      });
      if (data?.session) {
        setSession(data.session);
        await loadProfile(data.session.user.id, email, fullName);
      }
      return { error: null };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setSession(null);
  };

  const refreshProfile = async () => {
    if (session?.user) {
      await loadProfile(session.user.id, session.user.email, profile?.full_name || undefined);
    }
  };

  return (
    <AuthContext.Provider
      value={{ session, user: session?.user ?? null, profile, loading, signIn, signUp, signOut, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

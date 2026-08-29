'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Session, SupabaseClient } from '@supabase/supabase-js';
import { createClient } from './supabase/client';
import { supabaseConfigured } from './supabase/config';
import type { Profile } from './types';

type Result = { error: string | null };

interface ProfileRow {
  id: string;
  display_name: string;
  player_code: string;
  is_guest: boolean;
  created_at: string;
}

function mapProfile(row: ProfileRow, email: string | null): Profile {
  return {
    id: row.id,
    displayName: row.display_name,
    playerCode: row.player_code,
    isGuest: row.is_guest,
    email,
    createdAt: row.created_at,
  };
}

interface AuthContextValue {
  configured: boolean;
  loading: boolean;
  session: Session | null;
  profile: Profile | null;
  signInWithPassword: (email: string, password: string) => Promise<Result>;
  signUpWithPassword: (
    email: string,
    password: string,
    displayName: string
  ) => Promise<Result & { needsConfirmation: boolean }>;
  signInWithGoogle: () => Promise<Result>;
  signInWithMagicLink: (email: string) => Promise<Result>;
  continueAsGuest: () => Promise<Result>;
  upgradeGuest: (email: string, password: string, displayName: string) => Promise<Result>;
  signOut: () => Promise<void>;
  updateDisplayName: (name: string) => Promise<Result>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // createClient() itself memoizes a module-level singleton, so re-running
  // this initializer (e.g. under StrictMode) still returns the same client.
  const [client] = useState<SupabaseClient | null>(() => (supabaseConfigured ? createClient() : null));

  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  // Nothing to wait for when there's no backend configured.
  const [loading, setLoading] = useState(() => supabaseConfigured);

  const fetchProfile = useCallback(async (userId: string, email: string | null) => {
    const supabase = client;
    if (!supabase) return;
    // The profiles row is created by a DB trigger right after sign-up, so it
    // can lag the client by a beat — retry briefly instead of showing nothing.
    for (let attempt = 0; attempt < 6; attempt++) {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
      if (data) {
        setProfile(mapProfile(data as ProfileRow, email));
        return;
      }
      if (error) break;
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
  }, [client]);

  useEffect(() => {
    const supabase = client;
    if (!supabase) return;
    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      if (data.session) fetchProfile(data.session.user.id, data.session.user.email ?? null);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession) fetchProfile(newSession.user.id, newSession.user.email ?? null);
      else setProfile(null);
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [client, fetchProfile]);

  const notConfigured = useCallback(
    (): Result => ({ error: 'Backend not configured — see README.md "Backend setup".' }),
    []
  );

  const signInWithPassword = useCallback<AuthContextValue['signInWithPassword']>(async (email, password) => {
    const supabase = client;
    if (!supabase) return notConfigured();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  }, [client, notConfigured]);

  const signUpWithPassword = useCallback<AuthContextValue['signUpWithPassword']>(
    async (email, password, displayName) => {
      const supabase = client;
      if (!supabase) return { ...notConfigured(), needsConfirmation: false };
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: displayName },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      return { error: error?.message ?? null, needsConfirmation: !error && !data.session };
    },
    [client, notConfigured]
  );

  const signInWithGoogle = useCallback<AuthContextValue['signInWithGoogle']>(async () => {
    const supabase = client;
    if (!supabase) return notConfigured();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    return { error: error?.message ?? null };
  }, [client, notConfigured]);

  const signInWithMagicLink = useCallback<AuthContextValue['signInWithMagicLink']>(async (email) => {
    const supabase = client;
    if (!supabase) return notConfigured();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    return { error: error?.message ?? null };
  }, [client, notConfigured]);

  const continueAsGuest = useCallback<AuthContextValue['continueAsGuest']>(async () => {
    const supabase = client;
    if (!supabase) return notConfigured();
    const { error } = await supabase.auth.signInAnonymously();
    return { error: error?.message ?? null };
  }, [client, notConfigured]);

  const upgradeGuest = useCallback<AuthContextValue['upgradeGuest']>(
    async (email, password, displayName) => {
      const supabase = client;
      if (!supabase || !session) return notConfigured();
      const { error } = await supabase.auth.updateUser({
        email,
        password,
        data: { full_name: displayName },
      });
      if (error) return { error: error.message };
      await supabase
        .from('profiles')
        .update({ display_name: displayName, is_guest: false, updated_at: new Date().toISOString() })
        .eq('id', session.user.id);
      setProfile((p) => (p ? { ...p, displayName, isGuest: false, email } : p));
      return { error: null };
    },
    [client, notConfigured, session]
  );

  const signOut = useCallback(async () => {
    const supabase = client;
    if (!supabase) return;
    await supabase.auth.signOut();
  }, [client]);

  const updateDisplayName = useCallback<AuthContextValue['updateDisplayName']>(
    async (name) => {
      const supabase = client;
      if (!supabase || !session) return notConfigured();
      const { error } = await supabase
        .from('profiles')
        .update({ display_name: name, updated_at: new Date().toISOString() })
        .eq('id', session.user.id);
      if (!error) setProfile((p) => (p ? { ...p, displayName: name } : p));
      return { error: error?.message ?? null };
    },
    [client, notConfigured, session]
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      configured: supabaseConfigured,
      loading,
      session,
      profile,
      signInWithPassword,
      signUpWithPassword,
      signInWithGoogle,
      signInWithMagicLink,
      continueAsGuest,
      upgradeGuest,
      signOut,
      updateDisplayName,
    }),
    [
      loading,
      session,
      profile,
      signInWithPassword,
      signUpWithPassword,
      signInWithGoogle,
      signInWithMagicLink,
      continueAsGuest,
      upgradeGuest,
      signOut,
      updateDisplayName,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

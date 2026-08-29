'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { StoreProvider, useStore } from '@/lib/store';
import { AuthProvider, useAuth } from '@/lib/auth';

function useThemeEffect() {
  const { state } = useStore();
  const { theme, accent, textScale } = state.prefs;

  useEffect(() => {
    const root = document.documentElement;

    function applyResolved(mode: 'midnight' | 'ivory') {
      if (mode === 'ivory') root.setAttribute('data-theme', 'light');
      else root.removeAttribute('data-theme');
    }

    if (theme === 'auto') {
      const mq = window.matchMedia('(prefers-color-scheme: light)');
      const update = () => applyResolved(mq.matches ? 'ivory' : 'midnight');
      update();
      mq.addEventListener('change', update);
      return () => mq.removeEventListener('change', update);
    }
    applyResolved(theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.setAttribute('data-accent', accent);
  }, [accent]);

  useEffect(() => {
    document.documentElement.style.fontSize = `${textScale * 100}%`;
  }, [textScale]);
}

const PUBLIC_PATHS = new Set(['/sign-in']);

function LoadingSplash() {
  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg)',
      }}
    >
      <div className="ds-h1" style={{ fontSize: 40, color: 'var(--tx)' }}>
        Hearts
      </div>
    </div>
  );
}

// proxy.ts already gates routes at the edge using the Supabase session
// cookie; this is a client-side backstop (session expiring mid-tab,
// first-load timing) rather than the primary defense.
function AuthGate({ children }: { children: React.ReactNode }) {
  const { ready: storeReady } = useStore();
  const { loading: authLoading, session } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  useThemeEffect();

  const ready = storeReady && !authLoading;

  useEffect(() => {
    if (!ready) return;
    const isPublic = PUBLIC_PATHS.has(pathname);
    if (!session && !isPublic) {
      router.replace('/sign-in');
    } else if (session && pathname === '/sign-in') {
      router.replace('/games');
    }
  }, [ready, session, pathname, router]);

  if (!ready) return <LoadingSplash />;
  if (!session && !PUBLIC_PATHS.has(pathname)) return null;
  if (session && pathname === '/sign-in') return null;

  return <>{children}</>;
}

export function ClientRoot({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <StoreProvider>
        <AuthGate>{children}</AuthGate>
      </StoreProvider>
    </AuthProvider>
  );
}

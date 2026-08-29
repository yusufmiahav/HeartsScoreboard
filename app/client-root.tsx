'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { StoreProvider, useStore } from '@/lib/store';

function useThemeEffect() {
  const { state } = useStore();
  const theme = state.user?.theme ?? 'midnight';
  const accent = state.user?.accent ?? 'crimson';
  const textScale = state.user?.textScale ?? 1;

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

function AuthGate({ children }: { children: React.ReactNode }) {
  const { state, ready } = useStore();
  const pathname = usePathname();
  const router = useRouter();
  useThemeEffect();

  useEffect(() => {
    if (!ready) return;
    const isPublic = PUBLIC_PATHS.has(pathname);
    if (!state.user && !isPublic) {
      router.replace('/sign-in');
    } else if (state.user && pathname === '/sign-in') {
      router.replace('/games');
    }
  }, [ready, state.user, pathname, router]);

  if (!ready) {
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

  if (!state.user && !PUBLIC_PATHS.has(pathname)) return null;
  if (state.user && pathname === '/sign-in') return null;

  return <>{children}</>;
}

export function ClientRoot({ children }: { children: React.ReactNode }) {
  return (
    <StoreProvider>
      <AuthGate>{children}</AuthGate>
    </StoreProvider>
  );
}

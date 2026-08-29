'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';

export default function RootPage() {
  const { state, ready } = useStore();
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;
    router.replace(state.user ? '/games' : '/sign-in');
  }, [ready, state.user, router]);

  return null;
}

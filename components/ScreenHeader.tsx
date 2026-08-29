'use client';

import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { BackIcon, IconButton } from './ui';

export function ScreenHeader({
  title,
  onBack,
  actions,
}: {
  title: string;
  onBack?: () => void;
  actions?: ReactNode;
}) {
  const router = useRouter();
  return (
    <div className="ds-header">
      <IconButton onClick={onBack ?? (() => router.back())} aria-label="Back">
        <BackIcon />
      </IconButton>
      <div className="ds-header__title">{title}</div>
      {actions}
    </div>
  );
}

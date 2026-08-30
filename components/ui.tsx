'use client';

import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

export function ProfileErrorNotice({ message }: { message: string }) {
  return (
    <div
      style={{
        fontSize: 12.5,
        color: 'var(--red)',
        background: 'var(--redsoft)',
        border: '1px solid var(--redline)',
        borderRadius: 12,
        padding: '10px 14px',
        lineHeight: 1.5,
      }}
    >
      {message}
    </div>
  );
}

export function Button({
  variant = 'primary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'dashed' | 'destructive' }) {
  const cls = {
    primary: 'ds-btn ds-btn--primary',
    secondary: 'ds-btn ds-btn--secondary',
    dashed: 'ds-btn ds-btn--dashed',
    destructive: 'ds-btn ds-btn--destructive',
  }[variant];
  return <button className={`${cls} ${className}`} {...props} />;
}

export function IconButton({
  className = '',
  header = false,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { header?: boolean }) {
  return (
    <button className={`ds-icon-btn ${header ? 'ds-icon-btn--header' : ''} ${className}`} {...props} />
  );
}

/** Jumps straight to the Games tab from mid-game screens that only otherwise offer a one-step-back chevron. */
export function GamesHomeButton({ beforeNavigate }: { beforeNavigate?: () => void }) {
  const router = useRouter();
  return (
    <IconButton
      aria-label="Go to games list"
      onClick={() => {
        beforeNavigate?.();
        router.push('/games');
      }}
    >
      ⌂
    </IconButton>
  );
}

export function TextField(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input className="ds-field" {...props} />;
}

export function Card({
  accent = false,
  className = '',
  children,
  ...rest
}: { accent?: boolean; className?: string; children: ReactNode } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`ds-card ${accent ? 'ds-card--accent' : ''} ${className}`} {...rest}>
      {children}
    </div>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return <div className="ds-eyebrow">{children}</div>;
}

export function Stepper({
  value,
  onChange,
  min = 0,
  max = 13,
  format,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  format?: (v: number) => string;
}) {
  return (
    <div className="ds-stepper">
      <button
        type="button"
        className="ds-stepper__btn"
        disabled={value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
        aria-label="Decrease"
      >
        −
      </button>
      <div className="ds-stepper__value ds-mono">{format ? format(value) : value}</div>
      <button
        type="button"
        className="ds-stepper__btn"
        disabled={value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
        aria-label="Increase"
      >
        +
      </button>
    </div>
  );
}

export function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label?: ReactNode }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'none', border: 'none', padding: 0 }}
    >
      {label}
      <span className={`ds-toggle ${on ? 'ds-toggle--on' : ''}`}>
        <span className="ds-toggle__knob" />
      </span>
    </button>
  );
}

export function Chip({
  active = false,
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return <button className={`ds-chip ${active ? 'ds-chip--active' : ''} ${className}`} {...props} />;
}

export function ProgressBar({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(100, value * 100));
  return (
    <div className="ds-progress">
      <div className="ds-progress__fill" style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Sheet({ onClose, children }: { onClose: () => void; children: ReactNode }) {
  return (
    <div
      className="ds-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="ds-sheet">{children}</div>
    </div>
  );
}

export const BackIcon = () => (
  <svg width="10" height="16" viewBox="0 0 10 16" fill="none">
    <path d="M8 1L1.5 8L8 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const UndoIcon = () => <span style={{ fontSize: 16 }}>↺</span>;

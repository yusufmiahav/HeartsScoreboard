'use client';

import { ScreenHeader } from '@/components/ScreenHeader';

const SCORING = [
  { icon: '♥', red: true, label: 'Each heart', value: '+1' },
  { icon: 'Q♠', label: 'Queen of spades', value: '+13' },
  { icon: 'J♦', red: true, label: 'Jack of diamonds', note: 'optional', value: '−10', valueRed: true },
  { icon: '☾', label: 'Shoot the moon', value: '0 / +26' },
];

const SECTIONS = [
  {
    title: 'Object',
    body: 'Lowest score wins. When anyone reaches the target, the game ends and the lowest total takes it.',
  },
  {
    title: 'The check',
    body:
      "Every hand's four scores must total 26 — or 16 when someone took J♦. The app warns you if they don't, but never blocks the save.",
  },
  {
    title: 'The deal',
    body: 'Thirteen cards each, clockwise. Pass three left, right, across, then hold. 2♣ leads the first trick.',
  },
  {
    title: 'The play',
    body:
      "Follow suit if you can. No hearts or Q♠ on the first trick. Hearts can't be led until broken; Q♠ can be led any time. No trumps.",
  },
  {
    title: 'Moon',
    body: 'Take all thirteen hearts and Q♠ and you score zero — everyone else takes 26.',
  },
];

export default function RulesPage() {
  return (
    <div className="ds-screen">
      <ScreenHeader title="Scoring" />
      <div className="ds-body">
        <div className="ds-card" style={{ overflow: 'hidden', marginBottom: 18, padding: 0 }}>
          {SCORING.map((row, i) => (
            <div
              key={row.label}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 13,
                padding: '13px 15px',
                borderBottom: i < SCORING.length - 1 ? '1px solid var(--line)' : 'none',
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: 'var(--sf2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 15,
                  color: row.red ? 'var(--red)' : undefined,
                  flex: 'none',
                }}
              >
                {row.icon}
              </div>
              <div style={{ flex: 1, fontSize: 14.5 }}>
                {row.label} {row.note && <span className="ds-dim2">· {row.note}</span>}
              </div>
              <div className="ds-mono" style={{ fontSize: 15, fontWeight: 500, color: row.valueRed ? 'var(--red)' : undefined }}>
                {row.value}
              </div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
          {SECTIONS.map((s) => (
            <div key={s.title}>
              <div className="ds-mono" style={{ fontSize: 9.5, letterSpacing: '.13em', textTransform: 'uppercase', color: 'var(--red)', marginBottom: 5 }}>
                {s.title}
              </div>
              <div style={{ fontSize: 13.5, lineHeight: 1.55, color: 'var(--dim)' }}>{s.body}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Button, Chip, Toggle } from '@/components/ui';
import type { MoonRule } from '@/lib/types';

const PRESETS = [50, 100, 150, 200];

export default function NewGamePage() {
  const { state, setDraftGameSetup } = useStore();
  const router = useRouter();
  const existingDraft = state.draftGameSetup;
  const [names, setNames] = useState(existingDraft?.playerNames ?? ['', '', '']);
  const [target, setTarget] = useState(existingDraft?.settings.targetScore ?? 100);
  const [jack, setJack] = useState(existingDraft?.settings.jackOfDiamonds ?? true);
  const [moonRule, setMoonRule] = useState<MoonRule>(existingDraft?.settings.moonRule ?? 'others26');

  function updateName(i: number, v: string) {
    setNames((prev) => prev.map((n, idx) => (idx === i ? v : n)));
  }

  function handleContinue() {
    setDraftGameSetup({ settings: { targetScore: target, jackOfDiamonds: jack, moonRule }, playerNames: names });
    router.push('/games/new/seating');
  }

  const filledCount = names.filter((n) => n.trim()).length;

  return (
    <div className="ds-screen">
      <ScreenHeader title="New game" />
      <div className="ds-body">
        <datalist id="known-players">
          {state.knownPlayers.map((p) => (
            <option key={p.id} value={p.name} />
          ))}
        </datalist>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
          <PlayerRow index={1} name={state.user?.displayName ?? 'You'} note="you" locked />
          {names.map((n, i) => (
            <PlayerRow
              key={i}
              index={i + 2}
              name={n}
              placeholder={`Player ${i + 2}`}
              onChange={(v) => updateName(i, v)}
              known={state.knownPlayers}
            />
          ))}
        </div>

        <div
          style={{
            display: 'flex',
            gap: 10,
            alignItems: 'flex-start',
            fontSize: 12.5,
            color: 'var(--dim)',
            marginBottom: 22,
            lineHeight: 1.5,
          }}
        >
          <span className="ds-mono" style={{ fontSize: 12, color: 'var(--dim)' }}>
            i
          </span>
          <span>Four players, 13 cards each. 2♣ leads the first trick.</span>
        </div>

        <div className="ds-eyebrow" style={{ marginBottom: 10 }}>
          Game ends at
        </div>
        <div className="ds-card" style={{ padding: 16, marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
            <button className="ds-stepper__btn" onClick={() => setTarget((t) => Math.max(10, t - 5))}>
              −
            </button>
            <div className="ds-mono" style={{ fontSize: 40 }}>
              {target}
            </div>
            <button className="ds-stepper__btn" onClick={() => setTarget((t) => t + 5)}>
              +
            </button>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          {PRESETS.map((p) => (
            <div key={p} style={{ flex: 1 }}>
              <Chip active={target === p} onClick={() => setTarget(p)} style={{ width: '100%' }}>
                {p}
              </Chip>
            </div>
          ))}
        </div>

        <div className="ds-eyebrow" style={{ marginBottom: 10 }}>
          House rules
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div className="ds-card" style={{ padding: 14 }}>
            <Toggle
              on={jack}
              onChange={setJack}
              label={
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <div style={{ fontSize: 14.5, fontWeight: 500 }}>J♦ scores −10</div>
                  <div style={{ fontSize: 12, color: 'var(--dim)' }}>Hands then total 16, not 26</div>
                </div>
              }
            />
          </div>
          <div className="ds-card" style={{ padding: 14 }}>
            <Toggle
              on={moonRule === 'others26'}
              onChange={(v) => setMoonRule(v ? 'others26' : 'shooterMinus26')}
              label={
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <div style={{ fontSize: 14.5, fontWeight: 500 }}>Moon: others +26</div>
                  <div style={{ fontSize: 12, color: 'var(--dim)' }}>Off = shooter takes −26</div>
                </div>
              }
            />
          </div>
        </div>
      </div>
      <div className="ds-foot">
        <Button variant="primary" onClick={handleContinue} disabled={filledCount < 3}>
          Choose seats
        </Button>
      </div>
    </div>
  );
}

function PlayerRow({
  index,
  name,
  note,
  placeholder,
  locked,
  onChange,
  known,
}: {
  index: number;
  name: string;
  note?: string;
  placeholder?: string;
  locked?: boolean;
  onChange?: (v: string) => void;
  known?: { id: string; name: string }[];
}) {
  return (
    <div className="ds-card" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px' }}>
      <div
        className="ds-mono"
        style={{
          width: 26,
          height: 26,
          borderRadius: '50%',
          background: 'var(--sf2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 12,
          flex: 'none',
        }}
      >
        {index}
      </div>
      {locked ? (
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15 }}>{name}</div>
          {note && <div style={{ fontSize: 11.5, color: 'var(--dim2)' }}>{note}</div>}
        </div>
      ) : (
        <div style={{ flex: 1 }}>
          <input
            className="ds-field"
            style={{ border: 'none', padding: '4px 0', background: 'transparent' }}
            value={name}
            placeholder={placeholder}
            onChange={(e) => onChange?.(e.target.value)}
            list={known ? 'known-players' : undefined}
          />
        </div>
      )}
    </div>
  );
}

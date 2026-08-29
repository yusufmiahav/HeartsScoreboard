'use client';

import { use, useState } from 'react';
import { notFound, useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { useAuth } from '@/lib/auth';
import {
  checkGameEnd,
  expectedHandTotal,
  nextHandNumber,
  placedPoints,
  remainingPoints,
  runningTotals,
} from '@/lib/engine';
import type { DraftHand } from '@/lib/types';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Button, IconButton, Sheet, Stepper, UndoIcon } from '@/components/ui';

export default function ScoreEntryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { getGame, setDraft, saveHand, undoHand } = useStore();
  const { profile } = useAuth();
  const router = useRouter();
  const game = getGame(id);
  const [moonPickerOpen, setMoonPickerOpen] = useState(false);
  const [activePlayerId, setActivePlayerId] = useState<string | null>(null);

  if (!game) return notFound();

  const draft = game.draftHand;
  const handNumber = nextHandNumber(game);
  const totals = runningTotals(game);
  const remaining = remainingPoints(draft);
  const placed = placedPoints(draft);
  const expected = expectedHandTotal(draft, game.settings);
  const balanced = !draft.moonBy && remaining === 0;

  function update(patch: Partial<DraftHand>) {
    setDraft(game!.id, { ...draft, ...patch });
  }

  function setHearts(playerId: string, value: number) {
    update({ hearts: { ...draft.hearts, [playerId]: value } });
    setActivePlayerId(playerId);
  }

  function toggleQueen(playerId: string) {
    update({ queenOf: draft.queenOf === playerId ? null : playerId });
    setActivePlayerId(playerId);
  }

  function toggleJack(playerId: string) {
    update({ jackOf: draft.jackOf === playerId ? null : playerId });
    setActivePlayerId(playerId);
  }

  function autoFillTarget() {
    const untouched = game!.players.find(
      (p) => (draft.hearts[p.id] ?? 0) === 0 && draft.queenOf !== p.id && draft.jackOf !== p.id
    );
    return untouched ?? game!.players[game!.players.length - 1];
  }

  function handleAutoFill() {
    const target = autoFillTarget();
    const current = draft.hearts[target.id] ?? 0;
    const add = Math.min(13 - current, remaining);
    if (add <= 0) return;
    setHearts(target.id, current + add);
  }

  function handleMoonPick(playerId: string | null) {
    update({ moonBy: playerId, hearts: {}, queenOf: null, jackOf: null });
    setMoonPickerOpen(false);
  }

  function handleSave() {
    const hypothetical = {
      ...game!,
      hands: [
        ...game!.hands,
        {
          n: handNumber,
          hearts: draft.hearts,
          queenOf: draft.queenOf,
          jackOf: draft.jackOf,
          moonBy: draft.moonBy,
          enteredBy: '',
          enteredAt: '',
        },
      ],
    };
    const result = checkGameEnd(hypothetical);
    const enteredBy = profile?.id ?? game!.players.find((p) => p.isYou)?.id ?? '';
    saveHand(game!.id, enteredBy);
    router.push(result.over ? `/games/${game!.id}/over` : `/games/${game!.id}/board`);
  }

  const canUndo = game.hands.length > 0;

  return (
    <div className="ds-screen">
      <ScreenHeader
        title={`Hand ${handNumber}`}
        actions={
          <IconButton
            aria-label="Undo last saved hand"
            disabled={!canUndo}
            onClick={() => {
              if (confirm('Undo the last saved hand?')) {
                undoHand(game!.id);
              }
            }}
          >
            <UndoIcon />
          </IconButton>
        }
      />
      <div className="ds-body">
        <div style={{ fontSize: 12, color: 'var(--dim)', marginBottom: 14 }}>Count the tricks</div>

        <div
          className="ds-card"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            marginBottom: 16,
            borderColor: balanced ? 'var(--line)' : 'var(--redline)',
            background: balanced ? 'var(--sf)' : 'var(--redsoft)',
          }}
        >
          <div className="ds-mono" style={{ fontSize: 13, color: balanced ? 'var(--dim)' : 'var(--red)' }}>
            {draft.moonBy ? 'Moon shot locked' : `${placed} / ${expected} placed · ${remaining} left`}
          </div>
          {!draft.moonBy && remaining > 0 && (
            <button
              onClick={handleAutoFill}
              className="ds-mono"
              style={{ fontSize: 12, color: 'var(--red)', fontWeight: 600, background: 'none', border: 'none' }}
            >
              Auto-fill {autoFillTarget().name} {remaining}
            </button>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {game.players.map((p) => {
            const isActive = activePlayerId === p.id;
            const hearts = draft.hearts[p.id] ?? 0;
            const hasQueen = draft.queenOf === p.id;
            const hasJack = draft.jackOf === p.id;
            const handScore = draft.moonBy
              ? p.id === draft.moonBy
                ? game.settings.moonRule === 'others26'
                  ? 0
                  : -26
                : game.settings.moonRule === 'others26'
                ? 26
                : 0
              : hearts + (hasQueen ? 13 : 0) - (hasJack && game.settings.jackOfDiamonds ? 10 : 0);

            return (
              <div
                key={p.id}
                className={`ds-card ${isActive ? 'ds-card--accent' : ''}`}
                style={{ padding: 14 }}
              >
                <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: 10 }}>
                  <div style={{ flex: 1, fontSize: 15, fontWeight: 600 }}>{p.name}</div>
                  <div className="ds-mono" style={{ fontSize: 12.5, color: 'var(--dim)', marginRight: 10 }}>
                    {totals[p.id] ?? 0} →
                  </div>
                  <div className="ds-mono" style={{ fontSize: 19 }}>
                    {handScore >= 0 ? `+${handScore}` : handScore}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Stepper
                    value={hearts}
                    onChange={(v) => setHearts(p.id, v)}
                    min={0}
                    max={13}
                    format={(v) => `♥ ${v}`}
                  />
                  <button
                    className="ds-tap"
                    onClick={() => toggleQueen(p.id)}
                    style={{
                      flex: 1,
                      borderRadius: 12,
                      border: `1px solid ${hasQueen ? 'var(--red)' : 'var(--line)'}`,
                      background: hasQueen ? 'var(--red)' : 'var(--sf2)',
                      color: hasQueen ? '#fff' : 'var(--tx)',
                      fontSize: 13.5,
                      fontWeight: 600,
                      height: 44,
                    }}
                  >
                    {hasQueen ? 'Q♠ 13' : 'Q♠'}
                  </button>
                  {game.settings.jackOfDiamonds && (
                    <button
                      className="ds-tap"
                      onClick={() => toggleJack(p.id)}
                      style={{
                        flex: 1,
                        borderRadius: 12,
                        border: `1px solid ${hasJack ? 'var(--red)' : 'var(--line)'}`,
                        background: hasJack ? 'var(--red)' : 'var(--sf2)',
                        color: hasJack ? '#fff' : 'var(--tx)',
                        fontSize: 13.5,
                        fontWeight: 600,
                        height: 44,
                      }}
                    >
                      {hasJack ? 'J♦ −10' : 'J♦'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <div style={{ flex: 1 }}>
            <Button variant="dashed" onClick={() => setMoonPickerOpen(true)}>
              ☾ Moon shot
            </Button>
          </div>
          <div style={{ flex: 1 }}>
            <Button variant="dashed" disabled title="Coming soon">
              ⌨ Type totals
            </Button>
          </div>
        </div>
      </div>
      <div className="ds-foot">
        <Button variant="primary" onClick={handleSave}>
          Save hand {handNumber}
        </Button>
      </div>

      {moonPickerOpen && (
        <Sheet onClose={() => setMoonPickerOpen(false)}>
          <div className="ds-h1" style={{ fontSize: 26, marginBottom: 4 }}>
            Who shot the moon?
          </div>
          <div style={{ fontSize: 13, color: 'var(--dim)', marginBottom: 18 }}>
            All 13 hearts and Q♠, taken by one player.
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {game.players.map((p) => (
              <button
                key={p.id}
                className="ds-tap"
                style={{
                  justifyContent: 'flex-start',
                  border: '1px solid var(--line)',
                  borderRadius: 12,
                  padding: '12px 16px',
                  fontSize: 15,
                }}
                onClick={() => handleMoonPick(p.id)}
              >
                {p.name}
              </button>
            ))}
            <button
              className="ds-tap ds-dim"
              style={{ justifyContent: 'flex-start', padding: '12px 16px', fontSize: 14 }}
              onClick={() => handleMoonPick(null)}
            >
              Nobody
            </button>
          </div>
        </Sheet>
      )}
    </div>
  );
}

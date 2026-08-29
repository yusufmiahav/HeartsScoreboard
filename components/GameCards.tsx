'use client';

import { useRouter } from 'next/navigation';
import type { Game } from '@/lib/types';
import { nextHandNumber, standings } from '@/lib/engine';
import { formatDate, formatRelativeTime } from '@/lib/format';
import { Button, Card, ProgressBar } from './ui';

export function LiveGameCard({ game }: { game: Game }) {
  const router = useRouter();
  const rows = standings(game);
  const hasDraft =
    Object.keys(game.draftHand.hearts).length > 0 || game.draftHand.queenOf || game.draftHand.jackOf || game.draftHand.moonBy;
  return (
    <Card accent style={{ padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <span style={{ color: 'var(--red)', fontSize: 10 }}>●</span>
        <span className="ds-mono" style={{ fontSize: 11, letterSpacing: '.08em', color: 'var(--red)', textTransform: 'uppercase' }}>
          Live · hand {nextHandNumber(game)}
        </span>
      </div>
      <div style={{ fontSize: 12.5, color: 'var(--dim)', marginBottom: 14 }}>
        to {game.settings.targetScore} · J♦ {game.settings.jackOfDiamonds ? 'on' : 'off'}
        {hasDraft && <span className="ds-accent"> · hand half-entered</span>}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
        {rows.map((r) => (
          <div key={r.player.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 64, fontSize: 13.5, fontWeight: 500 }}>{r.player.name}</div>
            <div style={{ flex: 1 }}>
              <ProgressBar value={Math.min(1, r.total / game.settings.targetScore)} />
            </div>
            <div className="ds-mono" style={{ fontSize: 15, width: 32, textAlign: 'right' }}>
              {r.total}
            </div>
          </div>
        ))}
      </div>
      <Button variant="primary" onClick={() => router.push(`/games/${game.id}/board`)}>
        Continue game
      </Button>
    </Card>
  );
}

export function PausedGameCard({ game, onResume }: { game: Game; onResume: (id: string) => void }) {
  const router = useRouter();
  const rows = standings(game);
  const hasDraft =
    Object.keys(game.draftHand.hearts).length > 0 || game.draftHand.queenOf || game.draftHand.jackOf || game.draftHand.moonBy;
  return (
    <Card style={{ padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <span style={{ fontSize: 11, color: 'var(--dim)' }}>‖</span>
        <span className="ds-mono" style={{ fontSize: 11, letterSpacing: '.08em', color: 'var(--dim)', textTransform: 'uppercase' }}>
          Paused · hand {nextHandNumber(game)}
        </span>
        <span style={{ marginLeft: 'auto', fontSize: 11.5, color: 'var(--dim2)' }}>
          {game.pausedAt ? formatRelativeTime(game.pausedAt) : ''}
        </span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, margin: '14px 0' }}>
        {rows.map((r) => (
          <div key={r.player.id} className="ds-inset" style={{ padding: '8px 10px' }}>
            <div style={{ fontSize: 12, color: 'var(--dim)' }}>{r.player.name}</div>
            <div className="ds-mono" style={{ fontSize: 17 }}>
              {r.total}
            </div>
          </div>
        ))}
      </div>
      {hasDraft && (
        <div
          style={{
            fontSize: 12,
            color: 'var(--red)',
            background: 'var(--redsoft)',
            border: '1px solid var(--redline)',
            borderRadius: 10,
            padding: '8px 10px',
            marginBottom: 12,
          }}
        >
          Hand {nextHandNumber(game)} half-entered
        </div>
      )}
      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{ flex: 1 }}>
          <Button
            variant="secondary"
            onClick={() => {
              onResume(game.id);
              router.push(`/games/${game.id}/board`);
            }}
          >
            Resume
          </Button>
        </div>
        <button
          className="ds-icon-btn"
          aria-label="Share"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(game.code);
            } catch {
              /* clipboard unavailable */
            }
          }}
        >
          ⇄
        </button>
      </div>
    </Card>
  );
}

export function FinishedGameRow({ game }: { game: Game }) {
  const router = useRouter();
  const rows = standings(game);
  const winner = game.players.find((p) => p.id === game.winnerId);
  const winnerTotal = rows.find((r) => r.player.id === game.winnerId)?.total;
  return (
    <button
      className="ds-tap"
      style={{
        width: '100%',
        justifyContent: 'flex-start',
        textAlign: 'left',
        background: 'var(--sf)',
        border: '1px solid var(--line)',
        borderRadius: 14,
        padding: '14px 16px',
        flexDirection: 'column',
        alignItems: 'stretch',
        gap: 4,
      }}
      onClick={() => router.push(`/games/${game.id}/over`)}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span style={{ fontSize: 14.5, fontWeight: 600 }}>
          {game.status === 'abandoned' ? 'Abandoned' : `${winner?.name ?? '—'} won · ${winnerTotal ?? '—'}`}
        </span>
        <span style={{ marginLeft: 'auto', fontSize: 11.5, color: 'var(--dim2)' }}>
          {game.finishedAt ? formatDate(game.finishedAt) : ''}
        </span>
      </div>
      <div style={{ fontSize: 12, color: 'var(--dim)' }}>{game.players.map((p) => p.name).join(', ')}</div>
      <div style={{ fontSize: 11.5, color: 'var(--dim2)' }}>
        {game.hands.length} hands · to {game.settings.targetScore}
      </div>
    </button>
  );
}

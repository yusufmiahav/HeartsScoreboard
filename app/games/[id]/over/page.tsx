'use client';

import { use, useState } from 'react';
import { notFound, useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { handScores, standings } from '@/lib/engine';
import { Celebration } from '@/components/Celebration';
import { Button } from '@/components/ui';

function joinNames(names: string[]): string {
  if (names.length <= 1) return names[0] ?? '';
  if (names.length === 2) return `${names[0]} & ${names[1]}`;
  return `${names.slice(0, -1).join(', ')} & ${names[names.length - 1]}`;
}

export default function GameOverPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { getGame, markCelebrationSeen, rematch } = useStore();
  const router = useRouter();
  const game = getGame(id);
  const [showCelebration, setShowCelebration] = useState<boolean | null>(null);

  if (!game) return notFound();

  const reveal = showCelebration ?? !game.celebrationSeen;

  if (reveal) {
    return (
      <Celebration
        game={game}
        onContinue={() => {
          markCelebrationSeen(game.id);
          setShowCelebration(false);
        }}
      />
    );
  }

  const rows = standings(game);
  const isWinner = (playerId: string) => game.winnerIds.includes(playerId);
  const winnerNames = joinNames(game.players.filter((p) => isWinner(p.id)).map((p) => p.name));
  const tied = game.winnerIds.length > 1;
  const winnerTotal = rows.find((r) => isWinner(r.player.id))?.total;
  // Whoever crossed the target ended the game — not necessarily the winner
  // (lowest total). The highest total among the standings is the closest
  // reliable stand-in for "who hit the wall" without tracking it explicitly.
  const hitPlayer = rows[rows.length - 1]?.player;

  let moons = 0;
  let worst = 0;
  let clean = 0;
  for (const winnerId of game.winnerIds) {
    for (const h of game.hands) {
      const scores = handScores(h, game.players, game.settings);
      const mine = scores[winnerId] ?? 0;
      if (h.moonBy === winnerId) moons++;
      if (mine > worst) worst = mine;
      if (mine === 0) clean++;
    }
  }

  function noteFor(playerId: string): string {
    const playerMoons = game!.hands.filter((h) => h.moonBy === playerId).length;
    const queenTaken = game!.hands.filter((h) => h.queenOf === playerId).length;
    const total = rows.find((r) => r.player.id === playerId)?.total ?? 0;
    if (playerMoons > 0) return `${playerMoons} moon${playerMoons > 1 ? 's' : ''}`;
    if (queenTaken > 1) return `${queenTaken}× Q♠`;
    if (total >= game!.settings.targetScore) return 'hit the wall';
    return '';
  }

  return (
    <div className="ds-screen">
      <div className="ds-body" style={{ paddingTop: 76 }}>
        <div className="ds-eyebrow">
          {hitPlayer?.name} hit {game.settings.targetScore} · game over
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, margin: '8px 0 4px' }}>
          <div className="ds-h1" style={{ fontSize: tied ? 34 : 44 }}>
            {winnerNames} {tied ? 'tie' : 'wins'}
          </div>
          <span style={{ fontSize: 26, color: 'var(--red)' }}>♥</span>
        </div>
        <div style={{ fontSize: 14.5, color: 'var(--dim)', marginBottom: 22 }}>
          {tied ? 'share it' : 'takes it'} with {winnerTotal} over {game.hands.length} hand
          {game.hands.length === 1 ? '' : 's'}
        </div>

        <div className="ds-card" style={{ overflow: 'hidden', padding: 0, marginBottom: 20 }}>
          {rows.map((r, i) => (
            <div
              key={r.player.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '14px 16px',
                borderBottom: i < rows.length - 1 ? '1px solid var(--line)' : 'none',
                background: isWinner(r.player.id) ? 'var(--redsoft)' : 'transparent',
              }}
            >
              <div
                className="ds-mono"
                style={{ fontSize: 11, width: 12, color: isWinner(r.player.id) ? 'var(--red)' : 'var(--dim2)' }}
              >
                {r.rank}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15.5, fontWeight: isWinner(r.player.id) ? 500 : 400 }}>{r.player.name}</div>
                {noteFor(r.player.id) && (
                  <div style={{ fontSize: 11.5, color: 'var(--dim2)' }}>{noteFor(r.player.id)}</div>
                )}
              </div>
              <div className="ds-mono" style={{ fontSize: 20, color: isWinner(r.player.id) ? 'var(--red)' : 'var(--tx)' }}>
                {r.total}
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 26 }}>
          <StatTile label="Moons shot" value={moons} />
          <StatTile label="Worst hand" value={worst} />
          <StatTile label="Clean hands" value={clean} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Button
            variant="primary"
            onClick={() => {
              const next = rematch(game.id);
              if (next) router.push(`/games/${next.id}/start`);
            }}
          >
            Rematch, same table
          </Button>
          <Button variant="secondary" onClick={() => router.push('/games')}>
            Back to games
          </Button>
        </div>
      </div>
    </div>
  );
}

function StatTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="ds-card" style={{ flex: 1, padding: '14px 12px', textAlign: 'center' }}>
      <div className="ds-mono" style={{ fontSize: 22 }}>
        {value}
      </div>
      <div style={{ fontSize: 10.5, color: 'var(--dim2)', letterSpacing: '.04em', marginTop: 4 }}>{label}</div>
    </div>
  );
}

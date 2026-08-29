'use client';

import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { Button } from '@/components/ui';
import { LiveGameCard, PausedGameCard, FinishedGameRow } from '@/components/GameCards';

export default function GamesPage() {
  const { state, resumeGame } = useStore();
  const router = useRouter();
  const games = state.games;
  const live = games.filter((g) => g.status === 'live');
  const paused = games.filter((g) => g.status === 'paused');
  const finished = games.filter((g) => g.status === 'finished' || g.status === 'abandoned');

  return (
    <div className="ds-body" style={{ paddingTop: 58 }}>
      <div className="ds-eyebrow">Hearts</div>
      <div className="ds-h1" style={{ fontSize: 32, margin: '4px 0 22px' }}>
        Games
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {live.map((g) => (
          <LiveGameCard key={g.id} game={g} />
        ))}
        {paused.map((g) => (
          <PausedGameCard key={g.id} game={g} onResume={resumeGame} />
        ))}

        <Button variant="dashed" onClick={() => router.push('/games/new')}>
          ＋ New game
        </Button>

        {finished.length > 0 && (
          <div style={{ marginTop: 14 }}>
            <div className="ds-eyebrow" style={{ marginBottom: 10 }}>
              Finished
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {finished.map((g) => (
                <FinishedGameRow key={g.id} game={g} />
              ))}
            </div>
          </div>
        )}

        {games.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--dim)', fontSize: 13.5 }}>
            No games yet. Start one to keep score at the table.
          </div>
        )}
      </div>
    </div>
  );
}

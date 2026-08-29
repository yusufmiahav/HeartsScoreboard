'use client';

import { useStore } from '@/lib/store';
import { handScores } from '@/lib/engine';
import type { Game } from '@/lib/types';

interface HandPoint {
  at: string;
  points: number;
}

function collectUserHands(games: Game[], userId: string): HandPoint[] {
  const points: HandPoint[] = [];
  for (const g of games) {
    for (const h of g.hands) {
      const scores = handScores(h, g.players, g.settings);
      points.push({ at: h.enteredAt, points: scores[userId] ?? 0 });
    }
  }
  return points.sort((a, b) => a.at.localeCompare(b.at));
}

function longestCleanStreak(games: Game[], userId: string): number {
  let best = 0;
  for (const g of games) {
    let run = 0;
    for (const h of g.hands) {
      const scores = handScores(h, g.players, g.settings);
      if ((scores[userId] ?? 0) === 0) {
        run++;
        best = Math.max(best, run);
      } else {
        run = 0;
      }
    }
  }
  return best;
}

export default function StatsPage() {
  const { state } = useStore();
  const user = state.user;
  if (!user) return null;

  const relevant = state.games.filter((g) => g.players.some((p) => p.id === user.id) && g.hands.length > 0);
  const finished = relevant.filter((g) => g.status === 'finished');
  const wins = finished.filter((g) => g.winnerId === user.id).length;
  const allHands = collectUserHands(relevant, user.id);
  const avgPerHand = allHands.length ? allHands.reduce((a, p) => a + p.points, 0) / allHands.length : 0;
  const moonsShot = relevant.reduce((sum, g) => sum + g.hands.filter((h) => h.moonBy === user.id).length, 0);
  const cleanStreak = longestCleanStreak(relevant, user.id);
  const last12 = allHands.slice(-12);
  const maxPoint = Math.max(1, ...last12.map((p) => p.points));
  const worstIndex = last12.reduce((wi, p, i) => (p.points > (last12[wi]?.points ?? -1) ? i : wi), 0);

  return (
    <div className="ds-body" style={{ paddingTop: 58 }}>
      <div className="ds-eyebrow">Overview</div>
      <div className="ds-h1" style={{ fontSize: 32, margin: '4px 0 22px' }}>
        Stats
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        <Tile label="Avg per hand" value={avgPerHand.toFixed(1)} />
        <Tile label="Moons shot" value={String(moonsShot)} />
        <Tile label="Clean streak" value={String(cleanStreak)} />
      </div>

      {finished.length > 0 && (
        <div style={{ fontSize: 12.5, color: 'var(--dim)', marginBottom: 24 }}>
          {wins} win{wins === 1 ? '' : 's'} across {finished.length} finished game{finished.length === 1 ? '' : 's'}.
        </div>
      )}

      {last12.length > 0 && (
        <>
          <div className="ds-eyebrow" style={{ marginBottom: 10 }}>
            Points per hand · last {last12.length}
          </div>
          <div className="ds-card" style={{ padding: '16px 14px', marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 90 }}>
              {last12.map((p, i) => (
                <div
                  key={i}
                  title={`${p.points}`}
                  style={{
                    flex: 1,
                    height: `${Math.max(4, (Math.max(p.points, 0) / maxPoint) * 90)}px`,
                    background: i === worstIndex ? 'var(--red)' : 'var(--sf2)',
                    borderRadius: 3,
                  }}
                />
              ))}
            </div>
            <div style={{ fontSize: 11, color: 'var(--dim2)', marginTop: 10 }}>
              Worst hand: <span className="ds-mono">{last12[worstIndex]?.points ?? 0}</span> points
            </div>
          </div>
        </>
      )}

      {relevant.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--dim)', fontSize: 13.5 }}>
          Play a hand to start building your stats.
        </div>
      )}
    </div>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="ds-card" style={{ flex: 1, padding: '14px 12px', textAlign: 'center' }}>
      <div className="ds-mono" style={{ fontSize: 22 }}>
        {value}
      </div>
      <div style={{ fontSize: 10.5, color: 'var(--dim2)', marginTop: 4 }}>{label}</div>
    </div>
  );
}

'use client';

import { use, useState } from 'react';
import { notFound, useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { isMoonHand, nextHandNumber, standings, totalsThroughHand } from '@/lib/engine';
import { threeLetter } from '@/lib/format';
import { Button, IconButton, Sheet, UndoIcon } from '@/components/ui';

export default function ScoreboardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { getGame, undoHand, pauseGame, abandonGame } = useStore();
  const router = useRouter();
  const game = getGame(id);
  const [pauseOpen, setPauseOpen] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);

  if (!game) return notFound();

  const rows = standings(game);
  const handNumber = nextHandNumber(game);
  const canUndo = game.hands.length > 0 && game.status !== 'finished';
  const has16 = game.hands.some((h) => !isMoonHand(h) && game.settings.jackOfDiamonds && h.jackOf);

  return (
    <div className="ds-screen">
      <div className="ds-header">
        <IconButton onClick={() => router.push('/games')} aria-label="Back">
          ←
        </IconButton>
        <div className="ds-header__title">Scoreboard</div>
        <IconButton aria-label="Rules" onClick={() => setRulesOpen(true)}>
          ?
        </IconButton>
        <IconButton aria-label="Pause" onClick={() => setPauseOpen(true)} style={{ marginLeft: 8 }}>
          ‖
        </IconButton>
      </div>

      <div className="ds-body">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
          {rows.map((r) => (
            <div
              key={r.player.id}
              className={`ds-card ${r.rank === 1 ? 'ds-card--accent' : ''}`}
              style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', gap: 12 }}
            >
              <div className="ds-mono" style={{ width: 16, fontSize: 12, color: r.rank === 1 ? 'var(--red)' : 'var(--dim2)' }}>
                {r.rank}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 600 }}>{r.player.name}</div>
                <div style={{ fontSize: 11.5, color: 'var(--dim)' }}>
                  {Math.max(0, r.fromOut)} from out · {r.avgPerHand.toFixed(1)} / hand
                </div>
              </div>
              {r.lastDelta !== null && (
                <div className="ds-mono" style={{ fontSize: 13, color: 'var(--dim2)', marginRight: 4 }}>
                  {r.lastDelta >= 0 ? `+${r.lastDelta}` : r.lastDelta}
                </div>
              )}
              <div className="ds-mono" style={{ fontSize: 26, color: r.rank === 1 ? 'var(--red)' : 'var(--tx)' }}>
                {r.total}
              </div>
            </div>
          ))}
        </div>

        {game.hands.length > 0 && (
          <>
            <div className="ds-eyebrow" style={{ marginBottom: 10 }}>
              Hand by hand
            </div>
            <div className="ds-card" style={{ overflowX: 'auto', padding: 0 }}>
              <table className="ds-mono" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: 'var(--sf2)' }}>
                    <Th>#</Th>
                    {game.players.map((p) => (
                      <Th key={p.id}>{threeLetter(p.name)}</Th>
                    ))}
                    <Th>Σ</Th>
                  </tr>
                </thead>
                <tbody>
                  {game.hands.map((h) => {
                    const scoresBefore = totalsThroughHand(game, game.hands.indexOf(h) - 1);
                    const scoresAfter = totalsThroughHand(game, game.hands.indexOf(h));
                    const deltas = game.players.map((p) => (scoresAfter[p.id] ?? 0) - (scoresBefore[p.id] ?? 0));
                    const rowTotal = deltas.reduce((a, b) => a + b, 0);
                    const moon = isMoonHand(h);
                    return (
                      <tr key={h.n} style={moon ? { background: 'var(--redsoft)' } : undefined}>
                        <Td>
                          {h.n}
                          {moon && <span className="ds-accent">☾</span>}
                        </Td>
                        {game.players.map((p, i) => (
                          <Td key={p.id}>{deltas[i]}</Td>
                        ))}
                        <Td>{rowTotal}</Td>
                      </tr>
                    );
                  })}
                  <tr style={{ background: 'var(--sf2)', fontWeight: 700 }}>
                    <Td>Σ</Td>
                    {game.players.map((p) => (
                      <Td key={p.id}>{rows.find((r) => r.player.id === p.id)?.total ?? 0}</Td>
                    ))}
                    <Td>—</Td>
                  </tr>
                </tbody>
              </table>
            </div>
            {has16 && (
              <div style={{ fontSize: 11, color: 'var(--dim2)', marginTop: 8 }}>
                Hands with J♦ taken total 16, not 26.
              </div>
            )}
          </>
        )}
      </div>

      <div className="ds-foot ds-foot__row">
        <IconButton disabled={!canUndo} onClick={() => undoHand(game.id)} aria-label="Undo">
          <UndoIcon />
        </IconButton>
        <div style={{ flex: 1 }}>
          <Button
            variant="primary"
            disabled={game.status === 'finished'}
            onClick={() => router.push(`/games/${game.id}/start`)}
          >
            Score hand {handNumber}
          </Button>
        </div>
      </div>

      {pauseOpen && (
        <Sheet onClose={() => setPauseOpen(false)}>
          <div className="ds-h1" style={{ fontSize: 28, marginBottom: 6 }}>
            Pause the game?
          </div>
          <div style={{ fontSize: 13.5, color: 'var(--dim)', marginBottom: 16 }}>
            Saved to your account so you can pick it back up later.
          </div>
          <div className="ds-eyebrow" style={{ marginBottom: 8 }}>
            What gets kept
          </div>
          <ul style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 22 }}>
            {['Saved hands and totals', 'The in-progress hand', 'Dealer and passing direction', 'House rules'].map(
              (t) => (
                <li key={t} style={{ fontSize: 13.5, color: 'var(--dim)', display: 'flex', gap: 8 }}>
                  <span className="ds-accent">✓</span> {t}
                </li>
              )
            )}
          </ul>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Button
              variant="primary"
              onClick={() => {
                pauseGame(game.id);
                router.push('/games');
              }}
            >
              Pause &amp; save
            </Button>
            <Button variant="secondary" onClick={() => setPauseOpen(false)}>
              Keep playing
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (confirm('Abandon this game? It will be moved to Finished as abandoned.')) {
                  abandonGame(game.id);
                  router.push('/games');
                }
              }}
            >
              Abandon game
            </Button>
          </div>
        </Sheet>
      )}

      {rulesOpen && (
        <Sheet onClose={() => setRulesOpen(false)}>
          <div className="ds-h1" style={{ fontSize: 26, marginBottom: 12 }}>
            This game&apos;s rules
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 14 }}>
            <RuleRow label="Game ends at" value={`${game.settings.targetScore}`} />
            <RuleRow label="J♦ scores −10" value={game.settings.jackOfDiamonds ? 'On' : 'Off'} />
            <RuleRow
              label="Shooting the moon"
              value={game.settings.moonRule === 'others26' ? 'Others +26' : 'Shooter −26'}
            />
          </div>
        </Sheet>
      )}
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th style={{ padding: '10px 12px', textAlign: 'right', color: 'var(--dim)', fontWeight: 500 }}>{children}</th>
  );
}
function Td({ children }: { children: React.ReactNode }) {
  return <td style={{ padding: '8px 12px', textAlign: 'right', borderTop: '1px solid var(--line)' }}>{children}</td>;
}
function RuleRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--line)' }}>
      <span style={{ color: 'var(--dim)' }}>{label}</span>
      <span className="ds-mono">{value}</span>
    </div>
  );
}

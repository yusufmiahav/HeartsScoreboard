'use client';

import { use } from 'react';
import { notFound, useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { dealerSeatForHand, nextHandNumber, passingDirectionForHand, runningTotals, type PassDirection } from '@/lib/engine';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Button, Chip } from '@/components/ui';

const DIRECTIONS: { key: PassDirection; label: string }[] = [
  { key: 'left', label: 'LEFT' },
  { key: 'right', label: 'RIGHT' },
  { key: 'across', label: 'ACROSS' },
  { key: 'hold', label: 'HOLD' },
];

function recipientForDirection(seatIndex: number, direction: PassDirection): number {
  switch (direction) {
    case 'left':
      return (seatIndex + 1) % 4;
    case 'right':
      return (seatIndex + 3) % 4;
    case 'across':
      return (seatIndex + 2) % 4;
    case 'hold':
    default:
      return seatIndex;
  }
}

export default function HandStartPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { getGame } = useStore();
  const router = useRouter();
  const game = getGame(id);

  if (!game) return notFound();

  const handNumber = nextHandNumber(game);
  const direction = passingDirectionForHand(handNumber);
  const dealerSeat = dealerSeatForHand(game, handNumber);
  const youIndex = 0;
  const passTo = direction === 'hold' ? null : game.players[recipientForDirection(youIndex, direction)];

  const totals = runningTotals(game);
  const half = game.settings.targetScore / 2;
  const nudgeTarget = game.players
    .map((p) => ({ p, total: totals[p.id] ?? 0 }))
    .filter((r) => r.total >= half)
    .sort((a, b) => b.total - a.total)[0];

  const seatPositions = [
    { top: '78%', left: '50%' }, // you, bottom
    { top: '50%', left: '90%' }, // right
    { top: '10%', left: '50%' }, // top
    { top: '50%', left: '10%' }, // left
  ];

  return (
    <div className="ds-screen">
      <ScreenHeader title={`Hand ${handNumber}`} />
      <div className="ds-body">
        <div style={{ position: 'relative', height: 260, margin: '10px 0 24px' }}>
          <div
            style={{
              position: 'absolute',
              inset: '20% 15%',
              borderRadius: '50%',
              border: '1px dashed var(--line2)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%,-50%)',
              textAlign: 'center',
            }}
          >
            <div className="ds-eyebrow">{direction === 'hold' ? 'No passing' : `Pass ${direction}`}</div>
            <div className="ds-h1" style={{ fontSize: 28, marginTop: 4 }}>
              Hand {handNumber}
            </div>
            {passTo && (
              <div className="ds-mono" style={{ fontSize: 12.5, color: 'var(--dim)', marginTop: 4 }}>
                → {passTo.name}
              </div>
            )}
          </div>
          {game.players.map((p, i) => {
            const isYou = i === youIndex;
            const isDealer = i === dealerSeat;
            const pos = seatPositions[i];
            return (
              <div
                key={p.id}
                style={{
                  position: 'absolute',
                  top: pos.top,
                  left: pos.left,
                  transform: 'translate(-50%,-50%)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: '50%',
                    background: isYou ? 'var(--red)' : 'var(--sf)',
                    border: isYou ? 'none' : '1px solid var(--line2)',
                    color: isYou ? '#fff' : 'var(--tx)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 15,
                    fontWeight: 600,
                  }}
                >
                  {p.name.slice(0, 1).toUpperCase()}
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--dim)', whiteSpace: 'nowrap' }}>
                  {p.name}
                  {isDealer && <span className="ds-accent"> · deals</span>}
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 22 }}>
          {DIRECTIONS.map((d) => (
            <div key={d.key} style={{ flex: 1 }}>
              <Chip active={d.key === direction} style={{ width: '100%' }} disabled>
                {d.label}
              </Chip>
            </div>
          ))}
        </div>

        <div className="ds-card" style={{ padding: 16, marginBottom: 14 }}>
          <div style={{ fontSize: 14, lineHeight: 1.5 }}>
            <strong>2♣ leads.</strong> No hearts or Q♠ on the first trick. Hearts can&apos;t be led until broken.
          </div>
        </div>

        {nudgeTarget && (
          <div
            className="ds-card"
            style={{ padding: 16, borderColor: 'var(--redline)', background: 'var(--redsoft)' }}
          >
            <div style={{ fontSize: 14, lineHeight: 1.5 }}>
              <strong>
                {nudgeTarget.p.name} is {game.settings.targetScore - nudgeTarget.total} from out.
              </strong>{' '}
              One bad hand ends it.
            </div>
          </div>
        )}
      </div>
      <div className="ds-foot">
        <Button variant="primary" onClick={() => router.push(`/games/${game.id}/entry`)}>
          Start scoring
        </Button>
      </div>
    </div>
  );
}

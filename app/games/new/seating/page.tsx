'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { passRecipientSeat, passingDirectionForHand } from '@/lib/engine';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Button } from '@/components/ui';

function shuffled<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function SeatingPage() {
  const { state, createGame, setDraftGameSetup } = useStore();
  const router = useRouter();
  const draft = state.draftGameSetup;

  const [order, setOrder] = useState<string[]>(draft?.playerNames ?? []);
  const [dealerSeat, setDealerSeat] = useState(0);
  const leavingRef = useRef(false);

  useEffect(() => {
    if (!draft && !leavingRef.current) {
      router.replace('/games/new');
    }
  }, [draft, router]);

  if (!draft) return null;

  const you = state.user?.displayName ?? 'You';
  const seatNames = [you, ...order];

  function move(i: number, dir: -1 | 1) {
    setOrder((prev) => {
      const j = i + dir;
      if (j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }

  function handleShuffle() {
    setOrder((prev) => shuffled(prev));
  }

  const handleDeal = () => {
    leavingRef.current = true;
    const game = createGame(draft.settings, order, dealerSeat);
    router.push(`/games/${game.id}/start`);
  };

  const direction = passingDirectionForHand(1);
  const passToSeat = passRecipientSeat(0, direction);

  return (
    <div className="ds-screen">
      <ScreenHeader
        title="Seating"
        onBack={() => {
          setDraftGameSetup({ ...draft, playerNames: order });
          router.push('/games/new');
        }}
      />
      <div className="ds-body">
        <div style={{ fontSize: 12.5, color: 'var(--dim)', marginBottom: 20, lineHeight: 1.5 }}>
          Who sits where, clockwise from you. Reorder the table, then pick who deals first.
        </div>

        <div className="ds-eyebrow" style={{ marginBottom: 10 }}>
          Table order
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
          <SeatRow index={1} name={you} locked note="you" />
          {order.map((name, i) => (
            <SeatRow
              key={`${name}-${i}`}
              index={i + 2}
              name={name}
              onMoveUp={i > 0 ? () => move(i, -1) : undefined}
              onMoveDown={i < order.length - 1 ? () => move(i, 1) : undefined}
            />
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          <div style={{ flex: 1 }}>
            <Button variant="secondary" onClick={handleShuffle}>
              Shuffle seats
            </Button>
          </div>
          <div style={{ flex: 1 }}>
            <Button variant="secondary" onClick={() => setOrder((prev) => [...prev].reverse())}>
              Reverse
            </Button>
          </div>
        </div>

        <div className="ds-eyebrow" style={{ marginBottom: 10 }}>
          First dealer
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
          {seatNames.map((name, i) => (
            <button
              key={i}
              className="ds-chip"
              onClick={() => setDealerSeat(i)}
              style={{
                borderColor: dealerSeat === i ? 'var(--redline)' : 'var(--line)',
                background: dealerSeat === i ? 'var(--redsoft)' : 'var(--sf2)',
                color: dealerSeat === i ? 'var(--red)' : 'var(--tx)',
              }}
            >
              {i === 0 ? `${name} (you)` : name}
            </button>
          ))}
        </div>

        <div className="ds-card" style={{ padding: 16 }}>
          <div className="ds-eyebrow" style={{ marginBottom: 8 }}>
            What this means
          </div>
          <div style={{ fontSize: 13.5, color: 'var(--dim)', lineHeight: 1.6 }}>
            <div>
              <strong style={{ color: 'var(--tx)' }}>{seatNames[dealerSeat]}</strong> deals hand 1.
            </div>
            <div>
              Hand 1: pass {direction} → <strong style={{ color: 'var(--tx)' }}>{seatNames[passToSeat]}</strong>
            </div>
          </div>
        </div>
      </div>
      <div className="ds-foot">
        <Button variant="primary" onClick={handleDeal}>
          Deal first hand
        </Button>
      </div>
    </div>
  );
}

function SeatRow({
  index,
  name,
  note,
  locked,
  onMoveUp,
  onMoveDown,
}: {
  index: number;
  name: string;
  note?: string;
  locked?: boolean;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}) {
  return (
    <div className="ds-card" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px' }}>
      <span style={{ fontSize: 14, color: 'var(--dim2)', flex: 'none' }}>⋮⋮</span>
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
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 15 }}>{name}</div>
        {note && <div style={{ fontSize: 11.5, color: 'var(--dim2)' }}>{note}</div>}
      </div>
      {!locked && (
        <div style={{ display: 'flex', gap: 4 }}>
          <button
            className="ds-stepper__btn"
            disabled={!onMoveUp}
            onClick={onMoveUp}
            aria-label={`Move ${name} up`}
            style={{ width: 32, height: 32, fontSize: 13 }}
          >
            ↑
          </button>
          <button
            className="ds-stepper__btn"
            disabled={!onMoveDown}
            onClick={onMoveDown}
            aria-label={`Move ${name} down`}
            style={{ width: 32, height: 32, fontSize: 13 }}
          >
            ↓
          </button>
        </div>
      )}
    </div>
  );
}

'use client';

import type { Game } from '@/lib/types';
import { standings } from '@/lib/engine';
import { Button } from './ui';
import styles from './celebration.module.css';

const CARD_TRANSFORMS = [
  { tx: '-84px', ty: '-6px', tr: '-17deg', suit: '♠', rank: '10', ace: false },
  { tx: '-28px', ty: '-24px', tr: '-6deg', suit: '♦', rank: 'J', ace: false, red: true },
  { tx: '28px', ty: '-24px', tr: '7deg', suit: '♠', rank: 'Q', ace: false },
  { tx: '84px', ty: '-6px', tr: '18deg', suit: '♥', rank: 'A', ace: true },
];

export function Celebration({
  game,
  onContinue,
}: {
  game: Game;
  onContinue: () => void;
}) {
  const rows = standings(game);
  const winnerList = game.players.filter((p) => game.winnerIds.includes(p.id)).map((p) => p.name);
  const winnerNames =
    winnerList.length <= 1
      ? (winnerList[0] ?? '')
      : winnerList.length === 2
        ? `${winnerList[0]} & ${winnerList[1]}`
        : `${winnerList.slice(0, -1).join(', ')} & ${winnerList[winnerList.length - 1]}`;
  const winnerTotal = rows.find((r) => game.winnerIds.includes(r.player.id))?.total;
  const hitPlayer = rows[rows.length - 1]?.player;

  return (
    <div className={styles.stage}>
      <div className={styles.glow} />
      <div className={styles.cards}>
        {CARD_TRANSFORMS.map((c, i) => (
          <div
            key={i}
            className={`${styles.card} ${c.ace ? styles.ace : ''}`}
            style={
              {
                '--tx': c.tx,
                '--ty': c.ty,
                '--tr': c.tr,
                animationDelay: `${0.05 + i * 0.07}s`,
              } as React.CSSProperties
            }
          >
            <div className="ds-mono" style={{ fontSize: 22, color: c.red ? 'var(--red)' : undefined }}>
              {c.rank}
            </div>
            <div style={{ fontSize: 17, color: c.red ? 'var(--red)' : undefined }}>{c.suit}</div>
          </div>
        ))}
      </div>

      <div className={styles.reveal}>
        <div className={`ds-eyebrow ${styles.name}`}>
          {hitPlayer?.name} hit {game.settings.targetScore} · lowest score wins
        </div>
        <div className={`ds-h1 ${styles.name}`} style={{ fontSize: winnerList.length > 1 ? 38 : 52, marginTop: 8 }}>
          {winnerNames}
        </div>
        <div className={styles.rule} />
        <div className={`ds-mono ${styles.score}`} style={{ fontSize: 32, marginTop: 16 }}>
          <span className="ds-accent">{winnerTotal}</span>{' '}
          <span style={{ fontSize: 13, color: 'var(--dim2)' }}>POINTS · {game.hands.length} HANDS</span>
        </div>
      </div>

      <div className={styles.standings}>
        {rows.map((r, i) => (
          <div key={r.player.id} className={styles.row} style={{ animationDelay: `${0.9 + i * 0.12}s` }}>
            <div className="ds-mono" style={{ fontSize: 10.5, width: 12, color: r.rank === 1 ? 'var(--red)' : 'var(--dim2)' }}>
              {r.rank}
            </div>
            <div style={{ flex: 1, fontSize: 14.5, fontWeight: r.rank === 1 ? 500 : 400, color: r.rank === 1 ? 'var(--tx)' : 'var(--dim)' }}>
              {r.player.name}
            </div>
            <div className="ds-mono" style={{ fontSize: 17, color: r.rank === 1 ? 'var(--red)' : 'var(--dim)' }}>
              {r.total}
            </div>
          </div>
        ))}
      </div>

      <div className={styles.buttons}>
        <Button variant="primary" onClick={onContinue}>
          See the full sheet
        </Button>
      </div>
    </div>
  );
}

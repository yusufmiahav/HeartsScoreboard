import type { DraftHand, Game, GamePlayer, GameSettings, Hand } from './types';

export const CARD_TOTAL = 26; // 13 hearts (1pt each) + Q♠ (13pt)
export const MOON_TOTAL = 78; // 3 opponents × 26

export function emptyDraft(): DraftHand {
  return { hearts: {}, queenOf: null, jackOf: null, moonBy: null };
}

/** Points assigned so far toward the 26-point card pool (hearts + Q♠). J♦ is a separate deduction and doesn't change this. */
export function placedPoints(draft: DraftHand): number {
  const heartsPlaced = Object.values(draft.hearts).reduce((a, b) => a + b, 0);
  return heartsPlaced + (draft.queenOf ? 13 : 0);
}

export function remainingPoints(draft: DraftHand): number {
  return Math.max(0, CARD_TOTAL - placedPoints(draft));
}

export function heartsAssigned(draft: DraftHand): number {
  return Object.values(draft.hearts).reduce((a, b) => a + b, 0);
}

/** Scores for a single hand, honoring the moon and J♦ rules. */
export function computeHandScores(
  draft: DraftHand,
  players: GamePlayer[],
  settings: GameSettings
): Record<string, number> {
  const scores: Record<string, number> = {};
  for (const p of players) scores[p.id] = 0;

  if (draft.moonBy) {
    const shooterTakesAll = settings.moonRule === 'others26';
    for (const p of players) {
      if (p.id === draft.moonBy) {
        scores[p.id] = shooterTakesAll ? 0 : -26;
      } else {
        scores[p.id] = shooterTakesAll ? 26 : 0;
      }
    }
    return scores;
  }

  for (const p of players) {
    scores[p.id] = draft.hearts[p.id] ?? 0;
  }
  if (draft.queenOf) scores[draft.queenOf] = (scores[draft.queenOf] ?? 0) + 13;
  if (settings.jackOfDiamonds && draft.jackOf) {
    scores[draft.jackOf] = (scores[draft.jackOf] ?? 0) - 10;
  }
  return scores;
}

export function expectedHandTotal(draft: DraftHand, settings: GameSettings): number {
  if (draft.moonBy) return MOON_TOTAL;
  return settings.jackOfDiamonds && draft.jackOf ? 16 : 26;
}

export function isMoonHand(hand: Hand): boolean {
  return !!hand.moonBy;
}

export function handScores(hand: Hand, players: GamePlayer[], settings: GameSettings): Record<string, number> {
  return computeHandScores(
    { hearts: hand.hearts, queenOf: hand.queenOf, jackOf: hand.jackOf, moonBy: hand.moonBy },
    players,
    settings
  );
}

export function runningTotals(game: Game): Record<string, number> {
  const totals: Record<string, number> = {};
  for (const p of game.players) totals[p.id] = 0;
  for (const hand of game.hands) {
    const scores = handScores(hand, game.players, game.settings);
    for (const p of game.players) totals[p.id] += scores[p.id] ?? 0;
  }
  return totals;
}

export function totalsThroughHand(game: Game, uptoHandIndex: number): Record<string, number> {
  const totals: Record<string, number> = {};
  for (const p of game.players) totals[p.id] = 0;
  for (let i = 0; i <= uptoHandIndex && i < game.hands.length; i++) {
    const scores = handScores(game.hands[i], game.players, game.settings);
    for (const p of game.players) totals[p.id] += scores[p.id] ?? 0;
  }
  return totals;
}

export interface Standing {
  rank: number;
  player: GamePlayer;
  total: number;
  fromOut: number;
  avgPerHand: number;
  lastDelta: number | null;
}

export function standings(game: Game): Standing[] {
  const totals = runningTotals(game);
  const lastScores = game.hands.length
    ? handScores(game.hands[game.hands.length - 1], game.players, game.settings)
    : null;
  const rows = game.players
    .map((player) => ({
      player,
      total: totals[player.id] ?? 0,
      fromOut: game.settings.targetScore - (totals[player.id] ?? 0),
      avgPerHand: game.hands.length ? (totals[player.id] ?? 0) / game.hands.length : 0,
      lastDelta: lastScores ? lastScores[player.id] ?? 0 : null,
    }))
    .sort((a, b) => a.total - b.total)
    .map((row, i) => ({ ...row, rank: i + 1 }));
  return rows;
}

export function dealerSeatForHand(game: Game, handNumber: number): number {
  return (game.firstDealerSeat + handNumber - 1) % 4;
}

export type PassDirection = 'left' | 'right' | 'across' | 'hold';

export function passingDirectionForHand(handNumber: number): PassDirection {
  const order: PassDirection[] = ['left', 'right', 'across', 'hold'];
  return order[(handNumber - 1) % 4];
}

/** Seat index a card passes to from `seatIndex`, given the round's direction. Seats run clockwise, you at 0. */
export function passRecipientSeat(seatIndex: number, direction: PassDirection): number {
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

export function nextHandNumber(game: Game): number {
  return game.hands.length + 1;
}

export function checkGameEnd(game: Game): { over: boolean; winnerId: string | null } {
  const totals = runningTotals(game);
  const anyOver = game.players.some((p) => (totals[p.id] ?? 0) >= game.settings.targetScore);
  if (!anyOver) return { over: false, winnerId: null };
  let winner = game.players[0];
  for (const p of game.players) {
    if ((totals[p.id] ?? 0) < (totals[winner.id] ?? 0)) winner = p;
  }
  return { over: true, winnerId: winner.id };
}

export function cloneDraftFromHand(hand: Hand): DraftHand {
  return {
    hearts: { ...hand.hearts },
    queenOf: hand.queenOf,
    jackOf: hand.jackOf,
    moonBy: hand.moonBy,
  };
}

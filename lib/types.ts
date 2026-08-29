export type ThemeMode = 'midnight' | 'ivory' | 'auto';
export type AccentId = 'crimson' | 'claret' | 'brass';
export type MoonRule = 'others26' | 'shooterMinus26';
export type BoardLayout = 'standings' | 'race' | 'ledger';
export type GameStatus = 'live' | 'paused' | 'finished' | 'abandoned';

export interface User {
  id: string;
  displayName: string;
  email: string | null;
  isGuest: boolean;
  theme: ThemeMode;
  accent: AccentId;
  density: 'regular' | 'compact';
  textScale: number;
  bigNumerals: boolean;
  colourSuits: boolean;
  createdAt: string;
}

export interface KnownPlayer {
  id: string;
  name: string;
  gamesTogether: number;
}

export interface GameSettings {
  targetScore: number;
  jackOfDiamonds: boolean;
  moonRule: MoonRule;
}

export interface Hand {
  n: number;
  hearts: Record<string, number>;
  queenOf: string | null;
  jackOf: string | null;
  moonBy: string | null;
  enteredBy: string;
  enteredAt: string;
}

export interface DraftHand {
  hearts: Record<string, number>;
  queenOf: string | null;
  jackOf: string | null;
  moonBy: string | null;
}

export interface GamePlayer {
  id: string;
  name: string;
  isYou: boolean;
  isGuest: boolean;
}

export interface Game {
  id: string;
  code: string;
  settings: GameSettings;
  players: GamePlayer[];
  firstDealerSeat: number;
  status: GameStatus;
  hands: Hand[];
  draftHand: DraftHand;
  createdAt: string;
  pausedAt: string | null;
  finishedAt: string | null;
  winnerId: string | null;
  celebrationSeen: boolean;
}

export interface AppState {
  user: User | null;
  knownPlayers: KnownPlayer[];
  games: Game[];
}

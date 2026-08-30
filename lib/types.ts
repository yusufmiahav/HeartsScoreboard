export type ThemeMode = 'midnight' | 'ivory' | 'auto';
export type AccentId = 'crimson' | 'claret' | 'brass';
export type MoonRule = 'others26' | 'shooterMinus26';
export type BoardLayout = 'standings' | 'race' | 'ledger';
export type GameStatus = 'live' | 'paused' | 'finished' | 'abandoned';

/** Real account identity, backed by Supabase auth + the `profiles` table. */
export interface Profile {
  id: string;
  displayName: string;
  playerCode: string;
  isGuest: boolean;
  email: string | null;
  createdAt: string;
}

export type FriendRequestStatus = 'pending' | 'accepted';

export interface FriendRequest {
  id: string;
  requesterId: string;
  addresseeId: string;
  status: FriendRequestStatus;
  createdAt: string;
  respondedAt: string | null;
  otherProfile: Profile;
  /** true if the signed-in user sent this request (vs. received it) */
  isOutgoing: boolean;
}

/** Local, per-browser appearance settings — not tied to any account. */
export interface UiPrefs {
  theme: ThemeMode;
  accent: AccentId;
  density: 'regular' | 'compact';
  textScale: number;
  bigNumerals: boolean;
  colourSuits: boolean;
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
  /** Usually one player, but a tie for lowest score means more than one. */
  winnerIds: string[];
  celebrationSeen: boolean;
}

export interface DraftGameSetup {
  settings: GameSettings;
  playerNames: string[];
}

export interface AppState {
  prefs: UiPrefs;
  knownPlayers: KnownPlayer[];
  games: Game[];
  draftGameSetup: DraftGameSetup | null;
}

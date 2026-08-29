'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import type { AppState, DraftGameSetup, DraftHand, Game, GamePlayer, GameSettings, Hand, KnownPlayer, User } from './types';
import { checkGameEnd, cloneDraftFromHand, emptyDraft } from './engine';
import { makeGameCode, makePlayerId, makeUuid } from './id';

const STORAGE_KEY = 'hearts-scoreboard:v1';

function defaultUser(overrides: Partial<User>): User {
  return {
    id: makePlayerId(),
    displayName: 'You',
    email: null,
    isGuest: false,
    theme: 'midnight',
    accent: 'crimson',
    density: 'regular',
    textScale: 1,
    bigNumerals: false,
    colourSuits: true,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

const initialState: AppState = {
  user: null,
  knownPlayers: [],
  games: [],
  draftGameSetup: null,
};

type Action =
  | { type: 'HYDRATE'; state: AppState }
  | { type: 'SIGN_IN'; user: User }
  | { type: 'SIGN_OUT' }
  | { type: 'UPDATE_USER'; patch: Partial<User> }
  | { type: 'UPSERT_KNOWN_PLAYERS'; players: KnownPlayer[] }
  | { type: 'SET_DRAFT_GAME_SETUP'; draft: DraftGameSetup | null }
  | { type: 'CREATE_GAME'; game: Game }
  | { type: 'DELETE_GAME'; gameId: string }
  | { type: 'SET_FIRST_DEALER'; gameId: string; seat: number }
  | { type: 'SET_DRAFT'; gameId: string; draft: DraftHand }
  | { type: 'SAVE_HAND'; gameId: string }
  | { type: 'UNDO_HAND'; gameId: string }
  | { type: 'PAUSE_GAME'; gameId: string }
  | { type: 'RESUME_GAME'; gameId: string }
  | { type: 'ABANDON_GAME'; gameId: string }
  | { type: 'MARK_CELEBRATION_SEEN'; gameId: string }
  | { type: 'START_REMATCH'; gameId: string; newGameId: string };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'HYDRATE':
      return { ...initialState, ...action.state };
    case 'SIGN_IN':
      return { ...state, user: action.user };
    case 'SIGN_OUT':
      return { ...state, user: null };
    case 'UPDATE_USER':
      return state.user ? { ...state, user: { ...state.user, ...action.patch } } : state;
    case 'UPSERT_KNOWN_PLAYERS': {
      const byId = new Map(state.knownPlayers.map((p) => [p.id, p]));
      for (const p of action.players) {
        const existing = byId.get(p.id);
        byId.set(p.id, existing ? { ...existing, name: p.name, gamesTogether: existing.gamesTogether + 1 } : p);
      }
      return { ...state, knownPlayers: Array.from(byId.values()) };
    }
    case 'SET_DRAFT_GAME_SETUP':
      return { ...state, draftGameSetup: action.draft };
    case 'CREATE_GAME':
      return { ...state, games: [action.game, ...state.games], draftGameSetup: null };
    case 'DELETE_GAME':
      return { ...state, games: state.games.filter((g) => g.id !== action.gameId) };
    case 'SET_FIRST_DEALER':
      return {
        ...state,
        games: state.games.map((g) => (g.id === action.gameId ? { ...g, firstDealerSeat: action.seat } : g)),
      };
    case 'SET_DRAFT':
      return {
        ...state,
        games: state.games.map((g) => (g.id === action.gameId ? { ...g, draftHand: action.draft } : g)),
      };
    case 'SAVE_HAND': {
      return {
        ...state,
        games: state.games.map((g) => {
          if (g.id !== action.gameId) return g;
          if (!state.user) return g;
          const hand: Hand = {
            n: g.hands.length + 1,
            hearts: { ...g.draftHand.hearts },
            queenOf: g.draftHand.queenOf,
            jackOf: g.draftHand.jackOf,
            moonBy: g.draftHand.moonBy,
            enteredBy: state.user.id,
            enteredAt: new Date().toISOString(),
          };
          const withHand: Game = { ...g, hands: [...g.hands, hand], draftHand: emptyDraft() };
          const result = checkGameEnd(withHand);
          if (result.over) {
            return {
              ...withHand,
              status: 'finished',
              finishedAt: new Date().toISOString(),
              winnerId: result.winnerId,
              celebrationSeen: false,
            };
          }
          return withHand;
        }),
      };
    }
    case 'UNDO_HAND': {
      return {
        ...state,
        games: state.games.map((g) => {
          if (g.id !== action.gameId) return g;
          if (!g.hands.length) return g;
          const lastHand = g.hands[g.hands.length - 1];
          return {
            ...g,
            hands: g.hands.slice(0, -1),
            draftHand: cloneDraftFromHand(lastHand),
            status: g.status === 'finished' ? 'live' : g.status,
            finishedAt: null,
            winnerId: null,
          };
        }),
      };
    }
    case 'PAUSE_GAME':
      return {
        ...state,
        games: state.games.map((g) =>
          g.id === action.gameId ? { ...g, status: 'paused', pausedAt: new Date().toISOString() } : g
        ),
      };
    case 'RESUME_GAME':
      return {
        ...state,
        games: state.games.map((g) => (g.id === action.gameId ? { ...g, status: 'live', pausedAt: null } : g)),
      };
    case 'ABANDON_GAME':
      return {
        ...state,
        games: state.games.map((g) => (g.id === action.gameId ? { ...g, status: 'abandoned' } : g)),
      };
    case 'MARK_CELEBRATION_SEEN':
      return {
        ...state,
        games: state.games.map((g) => (g.id === action.gameId ? { ...g, celebrationSeen: true } : g)),
      };
    default:
      return state;
  }
}

interface StoreContextValue {
  state: AppState;
  ready: boolean;
  signIn: (partial: { displayName: string; email?: string | null; isGuest?: boolean }) => User;
  signOut: () => void;
  updateUser: (patch: Partial<User>) => void;
  setDraftGameSetup: (draft: DraftGameSetup | null) => void;
  createGame: (settings: GameSettings, otherNames: string[], firstDealerSeat?: number) => Game;
  deleteGame: (gameId: string) => void;
  setFirstDealer: (gameId: string, seat: number) => void;
  setDraft: (gameId: string, draft: DraftHand) => void;
  saveHand: (gameId: string) => void;
  undoHand: (gameId: string) => void;
  pauseGame: (gameId: string) => void;
  resumeGame: (gameId: string) => void;
  abandonGame: (gameId: string) => void;
  markCelebrationSeen: (gameId: string) => void;
  getGame: (gameId: string) => Game | undefined;
  rematch: (gameId: string) => Game | undefined;
}

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [ready, setReady] = useState(false);
  const loadedOnce = useRef(false);

  useEffect(() => {
    if (loadedOnce.current) return;
    loadedOnce.current = true;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        dispatch({ type: 'HYDRATE', state: JSON.parse(raw) as AppState });
      }
    } catch {
      // ignore corrupt storage
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // storage full / unavailable — app still works in-memory
    }
  }, [state, ready]);

  const signIn = useCallback<StoreContextValue['signIn']>((partial) => {
    const user = defaultUser({
      displayName: partial.displayName,
      email: partial.email ?? null,
      isGuest: !!partial.isGuest,
    });
    dispatch({ type: 'SIGN_IN', user });
    return user;
  }, []);

  const signOut = useCallback(() => dispatch({ type: 'SIGN_OUT' }), []);
  const updateUser = useCallback((patch: Partial<User>) => dispatch({ type: 'UPDATE_USER', patch }), []);

  const setDraftGameSetup = useCallback(
    (draft: DraftGameSetup | null) => dispatch({ type: 'SET_DRAFT_GAME_SETUP', draft }),
    []
  );

  const createGame = useCallback<StoreContextValue['createGame']>(
    (settings, otherNames, firstDealerSeat = 0) => {
      const you: GamePlayer = {
        id: state.user?.id ?? makeUuid(),
        name: state.user?.displayName ?? 'You',
        isYou: true,
        isGuest: state.user?.isGuest ?? false,
      };
      const others: GamePlayer[] = otherNames.map((name) => {
        const trimmed = name.trim() || 'Player';
        const existing = state.knownPlayers.find((p) => p.name.toLowerCase() === trimmed.toLowerCase());
        return {
          id: existing?.id ?? makeUuid(),
          name: trimmed,
          isYou: false,
          isGuest: false,
        };
      });
      const game: Game = {
        id: makeUuid(),
        code: makeGameCode(),
        settings,
        players: [you, ...others],
        firstDealerSeat,
        status: 'live',
        hands: [],
        draftHand: emptyDraft(),
        createdAt: new Date().toISOString(),
        pausedAt: null,
        finishedAt: null,
        winnerId: null,
        celebrationSeen: true,
      };
      dispatch({ type: 'CREATE_GAME', game });
      dispatch({
        type: 'UPSERT_KNOWN_PLAYERS',
        players: others.map((o) => ({ id: o.id, name: o.name, gamesTogether: 1 })),
      });
      return game;
    },
    [state.user, state.knownPlayers]
  );

  const deleteGame = useCallback((gameId: string) => dispatch({ type: 'DELETE_GAME', gameId }), []);
  const setFirstDealer = useCallback((gameId: string, seat: number) => dispatch({ type: 'SET_FIRST_DEALER', gameId, seat }), []);
  const setDraft = useCallback((gameId: string, draft: DraftHand) => dispatch({ type: 'SET_DRAFT', gameId, draft }), []);
  const saveHand = useCallback((gameId: string) => dispatch({ type: 'SAVE_HAND', gameId }), []);
  const undoHand = useCallback((gameId: string) => dispatch({ type: 'UNDO_HAND', gameId }), []);
  const pauseGame = useCallback((gameId: string) => dispatch({ type: 'PAUSE_GAME', gameId }), []);
  const resumeGame = useCallback((gameId: string) => dispatch({ type: 'RESUME_GAME', gameId }), []);
  const abandonGame = useCallback((gameId: string) => dispatch({ type: 'ABANDON_GAME', gameId }), []);
  const markCelebrationSeen = useCallback((gameId: string) => dispatch({ type: 'MARK_CELEBRATION_SEEN', gameId }), []);
  const getGame = useCallback((gameId: string) => state.games.find((g) => g.id === gameId), [state.games]);

  const rematch = useCallback(
    (gameId: string) => {
      const prev = state.games.find((g) => g.id === gameId);
      if (!prev) return undefined;
      const game: Game = {
        id: makeUuid(),
        code: makeGameCode(),
        settings: prev.settings,
        players: prev.players,
        firstDealerSeat: (prev.firstDealerSeat + 1) % 4,
        status: 'live',
        hands: [],
        draftHand: emptyDraft(),
        createdAt: new Date().toISOString(),
        pausedAt: null,
        finishedAt: null,
        winnerId: null,
        celebrationSeen: true,
      };
      dispatch({ type: 'CREATE_GAME', game });
      return game;
    },
    [state.games]
  );

  const value = useMemo<StoreContextValue>(
    () => ({
      state,
      ready,
      signIn,
      signOut,
      updateUser,
      setDraftGameSetup,
      createGame,
      deleteGame,
      setFirstDealer,
      setDraft,
      saveHand,
      undoHand,
      pauseGame,
      resumeGame,
      abandonGame,
      markCelebrationSeen,
      getGame,
      rematch,
    }),
    [
      state,
      ready,
      signIn,
      signOut,
      updateUser,
      setDraftGameSetup,
      createGame,
      deleteGame,
      setFirstDealer,
      setDraft,
      saveHand,
      undoHand,
      pauseGame,
      resumeGame,
      abandonGame,
      markCelebrationSeen,
      getGame,
      rematch,
    ]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}

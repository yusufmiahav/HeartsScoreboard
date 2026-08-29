# Hearts Score Keeper

A mobile-first web app for keeping score at a four-player game of Hearts, built from the
`Hearts Score Keeper.dc.html` design canvas handoff. Next.js 16 (App Router), no backend yet —
state lives in `localStorage` so the app works offline at the table.

## Run it

### Docker (recommended)

```bash
docker compose up --build
```

Then open [http://localhost:3000](http://localhost:3000).

Or without compose:

```bash
docker build -t hearts-scoreboard .
docker run -p 3000:3000 hearts-scoreboard
```

### Locally, without Docker

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## What's implemented

The core turn-1 flow end to end, with real scoring/validation logic:

- Sign in (email + password, or guest) and auth gate
- Home — live / paused / finished game cards
- New game setup — players, target score, house rules (J♦, moon rule)
- Hand start — seating ring, passing direction, dealer, lead reminder, nudge card
- Score entry — hearts steppers, Q♠/J♦ toggles, moon-shot picker, live remainder chip,
  auto-fill, undo
- Scoreboard — standings + hand-by-hand ledger, pause/abandon
- Game over + a simplified winner celebration
- Stats (per-user aggregates), Settings (theme/accent/density), Rules reference

Scoring engine (`lib/engine.ts`) implements the full rule set from the handoff: hearts +1,
Q♠ +13, optional J♦ −10, shooting the moon (both house-rule variants), lowest-score-wins game
end, dealer rotation, and the left/right/across/hold passing cycle.

## Not yet built

Scoped out of this first pass — the handoff's turns 2–6 beyond the pieces above:

- Real accounts/backend (Supabase or equivalent), so games sync across four devices —
  everything currently lives in one browser's `localStorage`
- Full pause/resume sheet with multi-device sync and half-entered-hand recovery
- Player IDs, QR add-by-scan, friend requests, head-to-head stats
- Dispute/challenge voting flow
- Drag-to-seat ring and first-dealer cut/pick flow (seats are assigned in join order)
- "Type totals" keypad/card-grid entry modes (button is present but inert)
- Default board layout preference (race/ledger variants) and per-stat privacy controls
- Full winner-celebration animation timing/looping (a simplified version plays instead)

## Stack

Next.js 16 (Turbopack, App Router), TypeScript, no CSS framework — a small hand-rolled design
system in `app/globals.css` matching the handoff's tokens (Midnight/Ivory themes, Instrument
Serif/DM Sans/JetBrains Mono, radii, spacing, motion curve). State: React context + `useReducer`
persisted to `localStorage` (`lib/store.tsx`).

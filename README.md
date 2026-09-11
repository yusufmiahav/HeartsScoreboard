# Hearts Score Keeper

A mobile-first web app for keeping score at a four-player game of Hearts, built from the
`Hearts Score Keeper.dc.html` design canvas handoff. Next.js 16 (App Router) + Supabase for
accounts and friends; games themselves still live in each device's `localStorage` (see
"Not yet built").

## Backend setup

Accounts, Google sign-in and friends need a [Supabase](https://supabase.com) project. Takes
about 10 minutes the first time.

### 1. Create the Supabase project

1. Sign up / log in at [supabase.com](https://supabase.com) and click **New project**.
2. Pick an organization, name it (e.g. `hearts-scoreboard`), set a database password, pick a
   region, and create it. Wait for it to finish provisioning (~2 minutes).
3. In the project, go to **Settings → API**. You'll need two values from here in step 4:
   - **Project URL**
   - **anon public** key (not the `service_role` key — never put that in client code)

### 2. Run the database migration

1. In the Supabase dashboard, open **SQL Editor → New query**.
2. Paste in the contents of [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql)
   and click **Run**.
3. This creates `profiles` (one row per account, with a friendly `HRT·XXX·XXX` player ID) and
   `friend_requests` (pending/accepted, in either direction), with row-level security so people
   can only edit their own data, and a trigger that creates a profile automatically whenever
   someone signs up.

### 3. Enable guest (anonymous) sign-in

Settings → Authentication → Sign In / Providers → **Anonymous Sign-Ins** → turn it on. This is
what powers "Keep score as a guest" — it creates a real, backend-tracked account with no email,
which can be upgraded to a full account later from Settings without losing any history (same
underlying user ID, just adds an email + password to it).

### 4. Set the environment variables

Copy `.env.example` and fill in the two values from step 1 — to `.env.local` for `npm run dev`,
or to `.env` for Docker (`docker-compose.yml` reads `.env` automatically):

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Set `NEXT_PUBLIC_SITE_URL` to wherever people actually load the app (it's used to build the
redirect link after Google/email sign-in).

**Important for Docker specifically:** the first two `NEXT_PUBLIC_*` values get baked into the
browser bundle at *build* time, not read at container start. That means changing them, or
setting them for the first time, requires a rebuild (`docker compose up --build`), not just a
restart — `docker-compose.yml` already passes them through as build args when they're in `.env`.

Without these three set, the app still runs — sign-in shows a clear "backend not configured"
notice instead of failing silently.

### 5. Google sign-in

Google's side:

1. Go to the [Google Cloud Console](https://console.cloud.google.com/apis/credentials), create
   (or pick) a project, then **OAuth consent screen** → configure it (External is fine for
   testing; add your own email as a test user while it's not yet verified).
2. **Credentials → Create Credentials → OAuth client ID** → Application type **Web application**.
3. Under **Authorized redirect URIs**, add your Supabase callback URL — find the exact value in
   the Supabase dashboard at Authentication → Providers → Google, it looks like:
   `https://your-project-ref.supabase.co/auth/v1/callback`
4. Save, then copy the generated **Client ID** and **Client Secret**.

Supabase's side:

1. Authentication → Providers → **Google** → toggle it on.
2. Paste in the Client ID and Client Secret from above. Save.

That's it — the app's Google button (`lib/auth.tsx`'s `signInWithGoogle`) already calls
`supabase.auth.signInWithOAuth({ provider: 'google' })` and redirects through
`app/auth/callback/route.ts`, which exchanges the code for a session and sends people to
`/games`.

### Apple sign-in

Not wired up yet — it needs a paid Apple Developer Program membership ($99/yr) plus a Services
ID, Team ID, Key ID and private key from the Apple Developer portal. Once you have those,
enabling it is the same shape as Google: configure the provider in Supabase's Authentication →
Providers → Apple, then add a `signInWithApple` action to `lib/auth.tsx` and a button on the
sign-in page.

## Run it

### Docker (recommended)

```bash
docker compose up --build
```

Then open [http://localhost:3000](http://localhost:3000). Create `.env` first (see "Backend
setup" above) — sign-in will show a "backend not configured" notice otherwise, but the app
won't crash.

Or without compose (note the two Supabase values are `--build-arg`s, not `-e`, since they're
inlined into the client bundle at build time — see "Backend setup" step 4):

```bash
docker build -t hearts-scoreboard \
  --build-arg NEXT_PUBLIC_SUPABASE_URL=... \
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=... \
  .
docker run -p 3000:3000 -e NEXT_PUBLIC_SITE_URL=http://localhost:3000 hearts-scoreboard
```

### Locally, without Docker

```bash
npm install
cp .env.example .env.local   # fill in the Supabase values
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## What's implemented

**Accounts & friends (real backend, Supabase):**

- Sign in with email + password, Google, a one-time email code (magic link), or as a guest
  (anonymous auth) — guests can later "Save as an account" from Settings without losing history
- Session handling via `proxy.ts` (Next 16's renamed `middleware.ts`) + an `AuthProvider`; every
  account gets a `profiles` row and a friendly player ID (`HRT·XXX·XXX`)
- Friends: your player ID with a copy button, add-by-ID, incoming/outgoing requests
  (accept/decline/cancel), a friends list with remove, live-updating via Supabase Realtime

**The game itself (still local to each device — see "Not yet built"):**

- Home — live / paused / finished game cards, with delete for paused games
- New game setup — players, target score, house rules (J♦, moon rule)
- Seating — a dedicated page to reorder who sits where (relative to you, clockwise) and pick
  the first dealer, with a live "what this means" preview, before the game is created
- Hand start — the seating ring / left-right-across-hold view for each actual round, passing
  direction, dealer, lead reminder, nudge card
- Score entry — hearts steppers, Q♠/J♦ toggles, moon-shot picker, live remainder chip,
  auto-fill, undo
- Scoreboard — standings + hand-by-hand ledger, pause/abandon
- Game over + a simplified winner celebration
- Stats (per-account aggregates), Settings (theme/accent/density), Rules reference

Scoring engine (`lib/engine.ts`) implements the full rule set from the handoff: hearts +1,
Q♠ +13, optional J♦ −10, shooting the moon (both house-rule variants), lowest-score-wins game
end, dealer rotation, and the left/right/across/hold passing cycle.

## Not yet built

- **Apple sign-in** — see "Backend setup" above; blocked on Apple Developer enrollment
- **Games synced across devices/accounts.** Accounts and friends are real now, but a game's
  hands/scores still live only in the scorekeeper's browser `localStorage` — the other three
  players don't see it on their own devices yet. Wiring games into Supabase (a `games`/`hands`
  table, RLS scoped to the four players, Realtime for live updates) is the natural next step and
  would also unlock cross-device pause/resume and real head-to-head stats between friends.
- Full pause/resume sheet with multi-device sync and half-entered-hand recovery
- Dispute/challenge voting flow
- Drag-to-seat ring and the cut/pick first-dealer mini-game (seating page uses reorder
  buttons + a plain dealer picker instead — same outcome, simpler interaction)
- "Type totals" keypad/card-grid entry modes (button is present but inert)
- Default board layout preference (race/ledger variants) and per-stat privacy controls
- Full winner-celebration animation timing/looping (a simplified version plays instead)

## Stack

Next.js 16 (Turbopack, App Router), TypeScript, no CSS framework — a small hand-rolled design
system in `app/globals.css` matching the handoff's tokens (Midnight/Ivory themes, Instrument
Serif/DM Sans/JetBrains Mono, radii, spacing, motion curve). Supabase for auth + Postgres
(`lib/supabase/`, `lib/auth.tsx`, `lib/friends.ts`, `supabase/migrations/`). Game state: React
context + `useReducer` persisted to `localStorage` (`lib/store.tsx`).

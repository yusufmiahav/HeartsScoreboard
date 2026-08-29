// Deliberately not 'use client' or server-only: a plain, side-effect-free
// value that both client and server code need to import directly. Next.js
// treats every export of a 'use client' module as an opaque "client
// reference" when read from server code (proxy, route handlers) — even a
// constant boolean — so this check can't live inside client.ts/server.ts
// without silently always evaluating truthy there.
export const supabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

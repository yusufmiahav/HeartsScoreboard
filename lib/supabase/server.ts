import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { supabaseConfigured } from './config';

export { supabaseConfigured };

/** Server-side client for Route Handlers / Server Components. Cookie writes only work in a Route Handler. */
export async function createClient() {
  if (!supabaseConfigured) {
    throw new Error('Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.');
  }
  const cookieStore = await cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // called from a Server Component with no request context to write to — safe to ignore
          // when proxy.ts is also refreshing the session.
        }
      },
    },
  });
}

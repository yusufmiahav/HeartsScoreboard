import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { supabaseConfigured } from './config';

const PUBLIC_PATHS = ['/sign-in', '/auth/callback'];

function isPublicPath(path: string): boolean {
  return PUBLIC_PATHS.some((p) => path === p || path.startsWith(`${p}/`));
}

/**
 * Refreshes the Supabase session cookie and does an optimistic auth gate.
 * Runs on (almost) every request via proxy.ts. The real authorization check
 * still happens per-query via RLS — this just avoids flashing protected
 * screens at signed-out visitors.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  if (!supabaseConfigured) {
    // Nothing to gate until the app is wired to a Supabase project.
    return response;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    }
  );

  // getUser() (not getSession()) revalidates the token against Supabase Auth
  // rather than trusting whatever is in the cookie.
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  // Only redirect when we're actually sure there's no session. A transient
  // error here (network hiccup, a refresh race) isn't proof of being signed
  // out — treating it as one would silently bounce signed-in people back to
  // /sign-in on every navigation that happens to hit a flaky request. RLS is
  // still the real authorization boundary regardless of what this optimistic
  // check does.
  if (!user && !error && path !== '/' && !isPublicPath(path)) {
    const url = request.nextUrl.clone();
    url.pathname = '/sign-in';
    return NextResponse.redirect(url);
  }

  if (user && path === '/sign-in') {
    const url = request.nextUrl.clone();
    url.pathname = '/games';
    return NextResponse.redirect(url);
  }

  return response;
}

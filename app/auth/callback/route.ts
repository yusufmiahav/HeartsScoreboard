import { NextResponse } from 'next/server';
import { createClient, supabaseConfigured } from '@/lib/supabase/server';

// Google (and, in future, Apple) OAuth redirects here with a `code` param.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/games';
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || origin;

  if (code && supabaseConfigured) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Covers both a fresh Google sign-in and a guest linking Google via
      // Settings → "Save as an account" — either way, once there's a real
      // identity attached, this profile is no longer a guest's.
      if (data.user && !data.user.is_anonymous) {
        await supabase.from('profiles').update({ is_guest: false }).eq('id', data.user.id).eq('is_guest', true);
      }
      return NextResponse.redirect(`${siteUrl}${next}`);
    }
  }

  return NextResponse.redirect(`${siteUrl}/sign-in?error=auth_callback_failed`);
}

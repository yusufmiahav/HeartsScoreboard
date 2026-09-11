import { NextResponse } from 'next/server';
import { createClient, supabaseConfigured } from '@/lib/supabase/server';

// Google (and, in future, Apple) OAuth redirects here with a `code` param.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const oauthError = searchParams.get('error_description') ?? searchParams.get('error');
  const next = searchParams.get('next') ?? '/games';
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || origin;

  function fail(reason: string) {
    console.error('[auth/callback]', reason);
    return NextResponse.redirect(`${siteUrl}/sign-in?error=auth_callback_failed`);
  }

  if (oauthError) return fail(`provider returned: ${oauthError}`);
  if (!code || !supabaseConfigured) return fail(`missing code (${!!code}) or not configured (${supabaseConfigured})`);

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) return fail(`exchangeCodeForSession: ${error.message}`);

    // Covers both a fresh Google sign-in and a guest linking Google via
    // Settings → "Save as an account" — either way, once there's a real
    // identity attached, this profile is no longer a guest's.
    if (data.user && !data.user.is_anonymous) {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ is_guest: false })
        .eq('id', data.user.id)
        .eq('is_guest', true);
      // Non-fatal — the sign-in itself already succeeded, so don't block on this.
      if (updateError) console.error('[auth/callback] is_guest update failed:', updateError.message);
    }
    return NextResponse.redirect(`${siteUrl}${next}`);
  } catch (err) {
    return fail(`unhandled: ${err instanceof Error ? err.message : String(err)}`);
  }
}

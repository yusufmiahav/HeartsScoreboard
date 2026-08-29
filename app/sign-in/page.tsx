'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Button, TextField } from '@/components/ui';
import styles from './sign-in.module.css';

type Mode = 'signin' | 'signup';

export default function SignInPage() {
  const { configured, signInWithPassword, signUpWithPassword, signInWithGoogle, signInWithMagicLink, continueAsGuest } =
    useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) {
      setNote('Enter an email and password to continue.');
      return;
    }
    if (mode === 'signup' && !name.trim()) {
      setNote('Enter a name for your account.');
      return;
    }
    setBusy(true);
    setNote(null);
    if (mode === 'signin') {
      const { error } = await signInWithPassword(email.trim(), password);
      setBusy(false);
      if (error) {
        setNote(error);
        return;
      }
      router.replace('/games');
    } else {
      const { error, needsConfirmation } = await signUpWithPassword(email.trim(), password, name.trim());
      setBusy(false);
      if (error) {
        setNote(error);
        return;
      }
      if (needsConfirmation) {
        setNote('Check your email to confirm the account, then sign in.');
        setMode('signin');
        return;
      }
      router.replace('/games');
    }
  }

  async function handleGoogle() {
    setBusy(true);
    setNote(null);
    const { error } = await signInWithGoogle();
    setBusy(false);
    if (error) setNote(error);
    // on success the browser is redirected away to Google — nothing else to do here
  }

  async function handleMagicLink() {
    if (!email.trim()) {
      setNote('Enter your email above first, then tap this.');
      return;
    }
    setBusy(true);
    setNote(null);
    const { error } = await signInWithMagicLink(email.trim());
    setBusy(false);
    setNote(error ?? `Check ${email.trim()} for a sign-in link.`);
  }

  async function handleGuest() {
    setBusy(true);
    setNote(null);
    const { error } = await continueAsGuest();
    setBusy(false);
    if (error) {
      setNote(error);
      return;
    }
    router.replace('/games');
  }

  return (
    <div className="ds-screen" style={{ justifyContent: 'center' }}>
      <div className="ds-body" style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
        <div className={styles.fan} aria-hidden>
          <div className={`${styles.card} ${styles.spade}`}>♠</div>
          <div className={`${styles.card} ${styles.diamond}`}>♦</div>
          <div className={`${styles.card} ${styles.heart}`}>♥</div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <div className="ds-h1" style={{ fontSize: 54 }}>
            Hearts
          </div>
          <div className="ds-eyebrow" style={{ marginTop: 10 }}>
            Score keeper for the table
          </div>
        </div>

        {!configured && (
          <div
            style={{
              fontSize: 12.5,
              color: 'var(--red)',
              background: 'var(--redsoft)',
              border: '1px solid var(--redline)',
              borderRadius: 12,
              padding: '10px 14px',
              lineHeight: 1.5,
            }}
          >
            Backend not configured — accounts, Google sign-in and friends need a Supabase project. See README.md
            &quot;Backend setup&quot;.
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {mode === 'signup' && (
            <TextField
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
            />
          )}
          <TextField
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
          <TextField
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
          />
          <div style={{ marginTop: 4 }}>
            <Button type="submit" variant="primary" disabled={busy}>
              {mode === 'signin' ? 'Sign in' : 'Create account'}
            </Button>
          </div>
        </form>

        {note && (
          <div style={{ fontSize: 12.5, color: 'var(--dim)', textAlign: 'center', lineHeight: 1.5 }}>{note}</div>
        )}

        <div className={styles.divider}>
          <span />
          <span className="ds-dim2" style={{ fontSize: 12 }}>
            or
          </span>
          <span />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Button variant="secondary" onClick={handleMagicLink} disabled={busy}>
            Email me a code
          </Button>
          <Button variant="secondary" onClick={handleGoogle} disabled={busy}>
            Google
          </Button>
        </div>
      </div>

      <div className="ds-body" style={{ paddingTop: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Button variant="dashed" onClick={handleGuest} disabled={busy}>
          Keep score as a guest
        </Button>
        <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--dim)' }}>
          {mode === 'signin' ? (
            <>
              New here?{' '}
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setMode('signup');
                  setNote(null);
                }}
              >
                Create an account
              </a>
            </>
          ) : (
            <>
              Have an account?{' '}
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setMode('signin');
                  setNote(null);
                }}
              >
                Sign in
              </a>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { Button, TextField } from '@/components/ui';
import styles from './sign-in.module.css';

export default function SignInPage() {
  const { signIn } = useStore();
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [note, setNote] = useState<string | null>(null);

  function complete() {
    router.replace('/games');
  }

  function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password) {
      setNote('Enter a name, email and password to continue.');
      return;
    }
    signIn({ displayName: name.trim(), email: email.trim() });
    complete();
  }

  function handleGuest() {
    const n = String(Math.floor(1000 + Math.random() * 9000));
    signIn({ displayName: `Guest ${n}`, isGuest: true });
    complete();
  }

  function handleUnavailable(label: string) {
    setNote(`${label} isn't wired up in this demo yet — use email + password or continue as a guest.`);
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

        <form onSubmit={handleSignIn} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <TextField placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
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
            autoComplete="current-password"
          />
          <div style={{ marginTop: 4 }}>
            <Button type="submit" variant="primary">
              Sign in
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
          <Button variant="secondary" onClick={() => handleUnavailable('Email me a code')}>
            Email me a code
          </Button>
          <Button variant="secondary" onClick={() => handleUnavailable('Apple sign in')}>
             Apple
          </Button>
        </div>
      </div>

      <div className="ds-body" style={{ paddingTop: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Button variant="dashed" onClick={handleGuest}>
          Keep score as a guest
        </Button>
        <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--dim)' }}>
          New here? <a href="#" onClick={(e) => e.preventDefault()}>Create an account</a>
        </div>
      </div>
    </div>
  );
}

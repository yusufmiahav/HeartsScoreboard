'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { useAuth } from '@/lib/auth';
import { Button, ProfileErrorNotice, TextField, Toggle } from '@/components/ui';
import { initials } from '@/lib/format';
import type { AccentId, ThemeMode } from '@/lib/types';

const THEMES: { id: ThemeMode; label: string }[] = [
  { id: 'midnight', label: 'Midnight' },
  { id: 'ivory', label: 'Ivory' },
  { id: 'auto', label: 'Auto' },
];

const ACCENTS: { id: AccentId; label: string; hex: string }[] = [
  { id: 'crimson', label: 'Crimson', hex: '#E11D33' },
  { id: 'claret', label: 'Claret', hex: '#A3111F' },
  { id: 'brass', label: 'Brass', hex: '#D8B15A' },
];

export default function SettingsPage() {
  const { state, updatePrefs } = useStore();
  const { profile, profileError, signOut, upgradeGuest, linkGoogle, updateDisplayName } = useAuth();
  const router = useRouter();
  const prefs = state.prefs;

  const [showUpgrade, setShowUpgrade] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');

  async function handleSaveName(e: React.FormEvent) {
    e.preventDefault();
    if (!nameDraft.trim()) {
      setNote('Enter a name.');
      return;
    }
    setBusy(true);
    const { error } = await updateDisplayName(nameDraft.trim());
    setBusy(false);
    if (error) {
      setNote(error);
      return;
    }
    setEditingName(false);
  }

  async function handleUpgrade(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password) {
      setNote('Fill in a name, email and password.');
      return;
    }
    setBusy(true);
    const { error } = await upgradeGuest(email.trim(), password, name.trim());
    setBusy(false);
    if (error) {
      setNote(error);
      return;
    }
    setNote('Account saved — check your email to confirm it.');
    setShowUpgrade(false);
  }

  async function handleGoogleUpgrade() {
    setBusy(true);
    setNote(null);
    const { error } = await linkGoogle();
    setBusy(false);
    if (error) setNote(error);
    // on success the browser redirects away to Google — nothing else to do here
  }

  return (
    <div className="ds-body" style={{ paddingTop: 58 }}>
      <div className="ds-eyebrow">Settings</div>
      <div className="ds-h1" style={{ fontSize: 32, margin: '4px 0 22px' }}>
        Appearance
      </div>

      <div className="ds-eyebrow" style={{ marginBottom: 10 }}>
        Theme
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 22 }}>
        {THEMES.map((t) => (
          <button
            key={t.id}
            className="ds-tap ds-card"
            style={{
              flex: 1,
              flexDirection: 'column',
              gap: 8,
              padding: '14px 10px',
              borderColor: prefs.theme === t.id ? 'var(--redline)' : 'var(--line)',
            }}
            onClick={() => updatePrefs({ theme: t.id })}
          >
            <div
              style={{
                width: 40,
                height: 26,
                borderRadius: 6,
                background:
                  t.id === 'ivory' ? '#F8F5F4' : t.id === 'midnight' ? '#0A0708' : 'linear-gradient(90deg,#0A0708 50%,#F8F5F4 50%)',
                border: '1px solid var(--line2)',
              }}
            />
            <span style={{ fontSize: 12, color: prefs.theme === t.id ? 'var(--tx)' : 'var(--dim)' }}>{t.label}</span>
          </button>
        ))}
      </div>

      <div className="ds-eyebrow" style={{ marginBottom: 10 }}>
        Accent
      </div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 26 }}>
        {ACCENTS.map((a) => (
          <button
            key={a.id}
            onClick={() => updatePrefs({ accent: a.id })}
            aria-label={a.label}
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: a.hex,
              border: prefs.accent === a.id ? '2px solid var(--tx)' : '2px solid transparent',
              boxShadow: prefs.accent === a.id ? '0 0 0 2px var(--sf)' : 'none',
            }}
          />
        ))}
      </div>

      <div className="ds-eyebrow" style={{ marginBottom: 10 }}>
        Numbers &amp; density
      </div>
      <div className="ds-card" style={{ padding: 4, marginBottom: 26 }}>
        <SettingRow
          label="Big scoreboard numerals"
          on={prefs.bigNumerals}
          onChange={(v) => updatePrefs({ bigNumerals: v })}
        />
        <SettingRow
          label="Compact rows"
          on={prefs.density === 'compact'}
          onChange={(v) => updatePrefs({ density: v ? 'compact' : 'regular' })}
        />
        <SettingRow
          label="Suit symbols in colour"
          on={prefs.colourSuits}
          onChange={(v) => updatePrefs({ colourSuits: v })}
          last
        />
      </div>

      <div className="ds-eyebrow" style={{ marginBottom: 10 }}>
        Account
      </div>

      {profileError && (
        <div style={{ marginBottom: 10 }}>
          <ProfileErrorNotice message={profileError} />
        </div>
      )}

      {!profile && !profileError && (
        <div style={{ fontSize: 13, color: 'var(--dim)', marginBottom: 10 }}>Loading your profile…</div>
      )}

      {profile && (
        <>
          <div className="ds-card" style={{ padding: 14, marginBottom: 10 }}>
            {editingName ? (
              <form onSubmit={handleSaveName} style={{ display: 'flex', gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <TextField
                    autoFocus
                    value={nameDraft}
                    onChange={(e) => setNameDraft(e.target.value)}
                    placeholder="Name"
                  />
                </div>
                <Button type="submit" variant="secondary" disabled={busy} style={{ width: 'auto', padding: '0 16px' }}>
                  Save
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => setEditingName(false)}
                  style={{ width: 'auto' }}
                >
                  Cancel
                </Button>
              </form>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  className="ds-mono"
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 11,
                    background: 'var(--red)',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 15,
                    flex: 'none',
                  }}
                >
                  {initials(profile.displayName)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 500 }}>{profile.displayName}</div>
                  <div style={{ fontSize: 12, color: 'var(--dim2)', marginTop: 1 }}>
                    {profile.email ?? (profile.isGuest ? 'Guest player' : '')}
                  </div>
                </div>
                <div
                  className="ds-mono"
                  style={{ fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--dim2)', marginRight: 6 }}
                >
                  {profile.playerCode}
                </div>
                <button
                  className="ds-tap"
                  onClick={() => {
                    setNameDraft(profile.displayName);
                    setEditingName(true);
                  }}
                  aria-label="Edit name"
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    border: '1px solid var(--line)',
                    fontSize: 13,
                    flex: 'none',
                  }}
                >
                  ✎
                </button>
              </div>
            )}
          </div>

          {profile.isGuest && !showUpgrade && (
            <Button variant="dashed" onClick={() => setShowUpgrade(true)} style={{ marginBottom: 10 }}>
              Save as an account
            </Button>
          )}

          {profile.isGuest && showUpgrade && (
            <div className="ds-card" style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 10 }}>
              <div style={{ fontSize: 12.5, color: 'var(--dim)', marginBottom: 4 }}>
                Keeps this device&apos;s game history under a real account.
              </div>
              <Button variant="secondary" onClick={handleGoogleUpgrade} disabled={busy}>
                Continue with Google
              </Button>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '2px 0' }}>
                <div style={{ flex: 1, height: 1, background: 'var(--line)' }} />
                <span className="ds-dim2" style={{ fontSize: 11 }}>
                  or
                </span>
                <div style={{ flex: 1, height: 1, background: 'var(--line)' }} />
              </div>
              <form onSubmit={handleUpgrade} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <TextField placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
                <TextField
                  placeholder="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <TextField
                  placeholder="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <Button type="submit" variant="primary" disabled={busy}>
                  Save as an account
                </Button>
              </form>
            </div>
          )}
        </>
      )}

      {note && <div style={{ fontSize: 12.5, color: 'var(--dim)', marginBottom: 10, lineHeight: 1.5 }}>{note}</div>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 26 }}>
        <Button variant="secondary" onClick={() => router.push('/rules')}>
          Rules reference
        </Button>
        <Button
          variant="destructive"
          onClick={() => {
            if (confirm('Sign out? Your games stay saved on this device.')) signOut();
          }}
        >
          Sign out
        </Button>
      </div>
    </div>
  );
}

function SettingRow({
  label,
  on,
  onChange,
  last,
}: {
  label: string;
  on: boolean;
  onChange: (v: boolean) => void;
  last?: boolean;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 12px',
        borderBottom: last ? 'none' : '1px solid var(--line)',
      }}
    >
      <span style={{ fontSize: 14 }}>{label}</span>
      <Toggle on={on} onChange={onChange} />
    </div>
  );
}

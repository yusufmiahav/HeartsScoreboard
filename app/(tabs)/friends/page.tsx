'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useFriends } from '@/lib/friends';
import { initials } from '@/lib/format';
import { Button, TextField } from '@/components/ui';
import type { Profile } from '@/lib/types';

export default function FriendsPage() {
  const { profile } = useAuth();
  const { configured, loading, error, friends, incoming, outgoing, sendRequest, acceptRequest, removeRequest } =
    useFriends();
  const [code, setCode] = useState('');
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error: sendError } = await sendRequest(code);
    setBusy(false);
    if (sendError) {
      setNote(sendError);
    } else {
      setNote(`Request sent to ${code.trim().toUpperCase()}.`);
      setCode('');
    }
  }

  async function handleCopyId() {
    if (!profile) return;
    try {
      await navigator.clipboard.writeText(profile.playerCode);
      setNote('Copied.');
    } catch {
      setNote(profile.playerCode);
    }
  }

  return (
    <div className="ds-body" style={{ paddingTop: 58 }}>
      <div className="ds-eyebrow">Table history</div>
      <div className="ds-h1" style={{ fontSize: 32, margin: '4px 0 22px' }}>
        Friends
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
            marginBottom: 20,
            lineHeight: 1.5,
          }}
        >
          Backend not configured — friends need a Supabase project. See README.md &quot;Backend setup&quot;.
        </div>
      )}

      {profile && (
        <div className="ds-card" style={{ padding: 16, marginBottom: 16 }}>
          <div className="ds-eyebrow" style={{ marginBottom: 8 }}>
            Your player ID
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="ds-mono" style={{ fontSize: 18, letterSpacing: '.08em', flex: 1 }}>
              {profile.playerCode}
            </div>
            <Button variant="secondary" onClick={handleCopyId} style={{ width: 'auto', padding: '10px 16px' }}>
              Copy ID
            </Button>
          </div>
        </div>
      )}

      <form onSubmit={handleSend} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <div style={{ flex: 1 }}>
          <TextField
            placeholder="HRT·XXX·XXX"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            disabled={!configured || busy}
          />
        </div>
        <Button type="submit" variant="primary" disabled={!configured || busy} style={{ width: 'auto', padding: '0 20px' }}>
          Add
        </Button>
      </form>
      {note && <div style={{ fontSize: 12, color: 'var(--dim)', marginBottom: 16 }}>{note}</div>}
      {error && <div style={{ fontSize: 12, color: 'var(--red)', marginBottom: 16 }}>{error}</div>}

      {incoming.length > 0 && (
        <Section title="Requests">
          {incoming.map((r) => (
            <RequestRow key={r.id}>
              <PersonLine profile={r.otherProfile} />
              <div style={{ display: 'flex', gap: 6 }}>
                <Button
                  variant="secondary"
                  style={{ width: 'auto', padding: '8px 14px' }}
                  onClick={() => acceptRequest(r.id)}
                >
                  Accept
                </Button>
                <Button
                  variant="destructive"
                  style={{ width: 'auto' }}
                  onClick={() => removeRequest(r.id)}
                >
                  Decline
                </Button>
              </div>
            </RequestRow>
          ))}
        </Section>
      )}

      {outgoing.length > 0 && (
        <Section title="Sent">
          {outgoing.map((r) => (
            <RequestRow key={r.id}>
              <PersonLine profile={r.otherProfile} note="waiting" />
              <Button variant="destructive" style={{ width: 'auto' }} onClick={() => removeRequest(r.id)}>
                Cancel
              </Button>
            </RequestRow>
          ))}
        </Section>
      )}

      <Section title="Friends">
        {loading && <div style={{ fontSize: 13, color: 'var(--dim)' }}>Loading…</div>}
        {!loading && friends.length === 0 && configured && (
          <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--dim)', fontSize: 13.5 }}>
            No friends yet — add someone by their player ID above.
          </div>
        )}
        {friends.map((r) => (
          <RequestRow key={r.id}>
            <PersonLine profile={r.otherProfile} />
            <button
              className="ds-icon-btn"
              aria-label={`Remove ${r.otherProfile.displayName}`}
              onClick={() => {
                if (confirm(`Remove ${r.otherProfile.displayName} as a friend?`)) removeRequest(r.id);
              }}
            >
              ×
            </button>
          </RequestRow>
        ))}
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <div className="ds-eyebrow" style={{ marginBottom: 10 }}>
        {title}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{children}</div>
    </div>
  );
}

function RequestRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="ds-card" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px' }}>
      {children}
    </div>
  );
}

function PersonLine({ profile, note }: { profile: Profile; note?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
      <div
        className="ds-mono"
        style={{
          width: 36,
          height: 36,
          borderRadius: '50%',
          background: 'var(--sf2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 13,
          flex: 'none',
        }}
      >
        {initials(profile.displayName)}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14.5, fontWeight: 500 }}>{profile.displayName}</div>
        <div className="ds-mono" style={{ fontSize: 10.5, color: 'var(--dim2)', letterSpacing: '.06em' }}>
          {profile.playerCode}
          {note && <span> · {note}</span>}
        </div>
      </div>
    </div>
  );
}

'use client';

import { useStore } from '@/lib/store';
import { initials } from '@/lib/format';

export default function FriendsPage() {
  const { state } = useStore();

  return (
    <div className="ds-body" style={{ paddingTop: 58 }}>
      <div className="ds-eyebrow">Table history</div>
      <div className="ds-h1" style={{ fontSize: 32, margin: '4px 0 10px' }}>
        Friends
      </div>
      <div style={{ fontSize: 13, color: 'var(--dim)', marginBottom: 22, lineHeight: 1.5 }}>
        Player IDs, add-by-scan, requests and head-to-head records need real accounts on the backend — not wired up
        in this demo yet. Here&apos;s everyone you&apos;ve added to a game on this device.
      </div>

      {state.knownPlayers.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--dim)', fontSize: 13.5 }}>
          Nobody yet — add players when you start a new game.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {state.knownPlayers.map((p) => (
            <div key={p.id} className="ds-card" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px' }}>
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
                {initials(p.name)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14.5, fontWeight: 500 }}>{p.name}</div>
                <div style={{ fontSize: 11.5, color: 'var(--dim2)' }}>{p.gamesTogether} game{p.gamesTogether === 1 ? '' : 's'} together</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { createClient } from './supabase/client';
import { supabaseConfigured } from './supabase/config';
import { useAuth } from './auth';
import type { FriendRequest, Profile } from './types';

interface ProfileRow {
  id: string;
  display_name: string;
  player_code: string;
  is_guest: boolean;
  created_at: string;
}

interface RequestRow {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: 'pending' | 'accepted';
  created_at: string;
  responded_at: string | null;
  requester: ProfileRow;
  addressee: ProfileRow;
}

function mapProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    displayName: row.display_name,
    playerCode: row.player_code,
    isGuest: row.is_guest,
    email: null,
    createdAt: row.created_at,
  };
}

function mapRequest(row: RequestRow, myId: string): FriendRequest {
  const isOutgoing = row.requester_id === myId;
  return {
    id: row.id,
    requesterId: row.requester_id,
    addresseeId: row.addressee_id,
    status: row.status,
    createdAt: row.created_at,
    respondedAt: row.responded_at,
    otherProfile: mapProfile(isOutgoing ? row.addressee : row.requester),
    isOutgoing,
  };
}

const SELECT = `
  id, requester_id, addressee_id, status, created_at, responded_at,
  requester:profiles!friend_requests_requester_id_fkey(id, display_name, player_code, is_guest, created_at),
  addressee:profiles!friend_requests_addressee_id_fkey(id, display_name, player_code, is_guest, created_at)
`;

export function useFriends() {
  const { session, configured } = useAuth();
  const myId = session?.user.id ?? null;
  const client = useMemo(() => (supabaseConfigured ? createClient() : null), []);

  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!client || !myId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error: fetchError } = await client
      .from('friend_requests')
      .select(SELECT)
      .or(`requester_id.eq.${myId},addressee_id.eq.${myId}`)
      .order('created_at', { ascending: false });
    if (fetchError) {
      setError(fetchError.message);
    } else {
      setError(null);
      setRequests(((data ?? []) as unknown as RequestRow[]).map((r) => mapRequest(r, myId)));
    }
    setLoading(false);
  }, [client, myId]);

  useEffect(() => {
    // Deferred a tick so the initial fetch's setState calls happen in a
    // microtask callback rather than synchronously within the effect body.
    void Promise.resolve().then(refresh);
  }, [refresh]);

  useEffect(() => {
    if (!client || !myId) return;
    const channel = client
      .channel('friend_requests_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'friend_requests' }, () => refresh())
      .subscribe();
    return () => {
      client.removeChannel(channel);
    };
  }, [client, myId, refresh]);

  const sendRequest = useCallback(
    async (playerCode: string): Promise<{ error: string | null }> => {
      if (!client || !myId) return { error: 'Backend not configured — see README.md "Backend setup".' };
      const code = playerCode.trim().toUpperCase();
      if (!code) return { error: 'Enter a player ID.' };

      const { data: found, error: lookupError } = await client
        .from('profiles')
        .select('id, display_name, player_code, is_guest, created_at')
        .eq('player_code', code)
        .maybeSingle();
      if (lookupError) return { error: lookupError.message };
      if (!found) return { error: `No player found with ID ${code}.` };
      if (found.id === myId) return { error: "That's your own player ID." };

      const { error: insertError } = await client
        .from('friend_requests')
        .insert({ requester_id: myId, addressee_id: found.id });
      if (insertError) {
        if (insertError.code === '23505') {
          return { error: `You already have a pending or accepted connection with ${found.display_name}.` };
        }
        return { error: insertError.message };
      }
      await refresh();
      return { error: null };
    },
    [client, myId, refresh]
  );

  const acceptRequest = useCallback(
    async (requestId: string) => {
      if (!client) return;
      await client
        .from('friend_requests')
        .update({ status: 'accepted', responded_at: new Date().toISOString() })
        .eq('id', requestId);
      await refresh();
    },
    [client, refresh]
  );

  const removeRequest = useCallback(
    async (requestId: string) => {
      if (!client) return;
      await client.from('friend_requests').delete().eq('id', requestId);
      await refresh();
    },
    [client, refresh]
  );

  const friends = requests.filter((r) => r.status === 'accepted');
  const incoming = requests.filter((r) => r.status === 'pending' && !r.isOutgoing);
  const outgoing = requests.filter((r) => r.status === 'pending' && r.isOutgoing);

  return { configured, loading, error, friends, incoming, outgoing, sendRequest, acceptRequest, removeRequest };
}

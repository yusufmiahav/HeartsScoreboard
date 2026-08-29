const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function randomGroup(len: number): string {
  let out = '';
  for (let i = 0; i < len; i++) {
    out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return out;
}

export function makePlayerId(): string {
  return `HRT·${randomGroup(3)}·${randomGroup(3)}`;
}

export function makeGameCode(): string {
  return `GME·${randomGroup(3)}·${randomGroup(3)}`;
}

export function makeUuid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

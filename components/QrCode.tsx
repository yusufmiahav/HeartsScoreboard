'use client';

import { create } from 'qrcode/lib/core/qrcode';

export function PlayerQrCode({ value, size = 200 }: { value: string; size?: number }) {
  const { modules } = create(value, { errorCorrectionLevel: 'M' });
  const cell = size / modules.size;
  const path: string[] = [];
  for (let row = 0; row < modules.size; row++) {
    for (let col = 0; col < modules.size; col++) {
      if (modules.get(row, col)) {
        path.push(`M${col * cell} ${row * cell}h${cell}v${cell}h${-cell}z`);
      }
    }
  }
  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      width={size}
      height={size}
      role="img"
      aria-label="Player ID QR code"
      style={{ background: '#fff', borderRadius: 12, display: 'block' }}
    >
      <path d={path.join(' ')} fill="#0A0708" />
    </svg>
  );
}

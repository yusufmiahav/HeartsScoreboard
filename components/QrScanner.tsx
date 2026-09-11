'use client';

import { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import { Button, Sheet } from './ui';

export function QrScanner({ onScan, onClose }: { onScan: (text: string) => void; onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const onScanRef = useRef(onScan);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    onScanRef.current = onScan;
  });

  useEffect(() => {
    let stopped = false;
    let stream: MediaStream | null = null;
    let frame = 0;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    function tick() {
      const video = videoRef.current;
      if (video && ctx && video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const result = jsQR(image.data, image.width, image.height);
        if (result?.data) {
          onScanRef.current(result.data);
          return;
        }
      }
      frame = requestAnimationFrame(tick);
    }

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'environment' } })
      .then((s) => {
        if (stopped) {
          s.getTracks().forEach((t) => t.stop());
          return;
        }
        stream = s;
        const video = videoRef.current;
        if (video) {
          video.srcObject = s;
          void video.play();
        }
        frame = requestAnimationFrame(tick);
      })
      .catch(() => {
        setError("Couldn't access the camera — check your browser's camera permission, or enter the ID by hand.");
      });

    return () => {
      stopped = true;
      cancelAnimationFrame(frame);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  return (
    <Sheet onClose={onClose}>
      <div className="ds-h1" style={{ fontSize: 24, marginBottom: 12 }}>
        Scan a player ID
      </div>
      {error ? (
        <div style={{ fontSize: 13.5, color: 'var(--dim)', marginBottom: 16, lineHeight: 1.5 }}>{error}</div>
      ) : (
        <div
          style={{
            position: 'relative',
            aspectRatio: '1',
            borderRadius: 16,
            overflow: 'hidden',
            marginBottom: 16,
            background: '#000',
          }}
        >
          <video ref={videoRef} muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      )}
      <Button variant="secondary" onClick={onClose}>
        Cancel
      </Button>
    </Sheet>
  );
}

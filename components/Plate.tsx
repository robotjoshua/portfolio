'use client';
import { useEffect, useState } from 'react';
import type { Artifact } from '@/types/artifact';
import { PK } from './plates';

export function Plate({
  a,
  fit = 'cover',
  size = 'thumb',
  priority = false,
}: {
  a: Pick<Artifact, 'index' | 'palette' | 'images'>;
  fit?: 'cover' | 'contain';
  size?: 'thumb' | 'full';
  priority?: boolean;
}) {
  const hero = a.images?.[0];
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (hero?.src) {
    const src = size === 'full' ? (hero.src || hero.thumb) : (hero.thumb || hero.src);
    return (
      <div style={{ position: 'absolute', inset: 0, background: 'var(--img-bg)' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={hero.alt || ''}
          decoding="async"
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : 'auto'}
          style={{ width: '100%', height: '100%', objectFit: fit, display: 'block', imageRendering: 'auto' }}
        />
      </div>
    );
  }

  const s = a.index || 1;
  const R = PK[s % PK.length];
  return (
    <div style={{ position: 'absolute', inset: 0, background: 'var(--img-bg)' }}>
      {mounted && <R seed={s} palette={a.palette} />}
    </div>
  );
}

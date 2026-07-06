import { rnd } from '@/lib/rnd';
import type { PlateProps } from './types';

export function PlateDots({ seed: s, palette: p }: PlateProps) {
  const n = 100 + Math.floor(rnd(s, 3) * 140);
  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
    >
      <rect width={100} height={100} fill="var(--paper-2)" />
      {Array.from({ length: n }, (_, i) => (
        <circle
          key={i}
          cx={rnd(s, 60 + i) * 100}
          cy={rnd(s, 160 + i) * 100}
          r={0.4 + rnd(s, 260 + i) * 1.8}
          fill={p[0]}
          opacity={0.9}
        />
      ))}
    </svg>
  );
}

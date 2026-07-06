import { rnd } from '@/lib/rnd';
import type { PlateProps } from './types';

export function PlateBars({ seed: s, palette: p }: PlateProps) {
  const b = 14 + Math.floor(rnd(s, 2) * 10);
  return (
    <svg
      viewBox={`0 0 ${b} 100`}
      preserveAspectRatio="none"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
    >
      <rect width={b} height={100} fill="var(--paper-2)" />
      {Array.from({ length: b }).map((_, i) => {
        const h = 8 + rnd(s, 20 + i) * 90;
        return (
          <rect
            key={i}
            x={i + 0.1}
            y={100 - h}
            width={0.8}
            height={h}
            fill={i % 7 === 0 ? p[1] : p[0]}
            opacity={1}
          />
        );
      })}
    </svg>
  );
}

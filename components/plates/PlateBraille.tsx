import { rnd } from '@/lib/rnd';
import type { PlateProps } from './types';

export function PlateBraille({ seed: s, palette: p }: PlateProps) {
  const rows = 10;
  const cols = 14;
  return (
    <svg
      viewBox={`0 0 ${cols} ${rows}`}
      preserveAspectRatio="none"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
    >
      <rect width={cols} height={rows} fill="var(--paper-2)" />
      {Array.from({ length: rows * cols }).map((_, i) => {
        if (rnd(s, 1700 + i) > 0.48) return null;
        return (
          <circle
            key={i}
            cx={(i % cols) + 0.5}
            cy={Math.floor(i / cols) + 0.5}
            r={0.3}
            fill={p[0]}
            opacity={1}
          />
        );
      })}
    </svg>
  );
}

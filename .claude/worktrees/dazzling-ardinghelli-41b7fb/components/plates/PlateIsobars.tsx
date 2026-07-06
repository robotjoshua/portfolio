import { rnd } from '@/lib/rnd';
import type { PlateProps } from './types';

export function PlateIsobars({ seed: s, palette: p }: PlateProps) {
  const rings = 5 + Math.floor(rnd(s, 10) * 4);
  const cx = 30 + rnd(s, 11) * 40;
  const cy = 30 + rnd(s, 12) * 40;
  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
    >
      <rect width={100} height={100} fill="var(--paper-2)" />
      {Array.from({ length: rings }).map((_, i) => {
        const rx = (i + 1) * (8 + rnd(s, 600 + i) * 4);
        const ry = rx * (0.6 + rnd(s, 700 + i) * 0.6);
        return (
          <ellipse
            key={i}
            cx={cx}
            cy={cy}
            rx={rx}
            ry={ry}
            transform={`rotate(${rnd(s, 800 + i) * 60} ${cx} ${cy})`}
            stroke={p[0]}
            strokeWidth={0.45}
            fill="none"
            opacity={0.85}
          />
        );
      })}
    </svg>
  );
}

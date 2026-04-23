import { rnd } from '@/lib/rnd';
import type { PlateProps } from './types';

export function PlateScatter({ seed: s, palette: p }: PlateProps) {
  const slope = 0.5 + rnd(s, 16) * 0.7;
  const pts = Array.from({ length: 40 }, (_, i) => ({
    x: rnd(s, 1500 + i) * 90 + 5,
    y: Math.max(
      5,
      Math.min(95, 95 - ((rnd(s, 1500 + i) * 90 + 5) * slope + (rnd(s, 1600 + i) - 0.5) * 30)),
    ),
  }));
  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
    >
      <rect width={100} height={100} fill="var(--paper-2)" />
      <line x1={5} y1={95} x2={95} y2={95} stroke="var(--ink)" strokeWidth={0.2} opacity={0.5} />
      <line x1={5} y1={5} x2={5} y2={95} stroke="var(--ink)" strokeWidth={0.2} opacity={0.5} />
      <line
        x1={5}
        y1={95 - 5 * slope}
        x2={95}
        y2={95 - 95 * slope}
        stroke={p[1]}
        strokeWidth={0.3}
        strokeDasharray="1.5 1"
        opacity={0.7}
      />
      {pts.map((pt, i) => (
        <circle key={i} cx={pt.x} cy={pt.y} r={1.4} fill={p[0]} opacity={0.95} />
      ))}
    </svg>
  );
}

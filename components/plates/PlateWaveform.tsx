import { rnd } from '@/lib/rnd';
import type { PlateProps } from './types';

export function PlateWaveform({ seed: s, palette: p }: PlateProps) {
  const S = 80;
  const bars = Array.from({ length: S }, (_, i) => {
    const t = i / S;
    return (
      10 +
      Math.abs(Math.sin(t * Math.PI * (2 + rnd(s, 7) * 6))) *
        (0.4 + rnd(s, 300 + i) * 0.6) *
        (1 - Math.abs(t - 0.5)) *
        80
    );
  });
  return (
    <svg
      viewBox={`0 0 ${S} 100`}
      preserveAspectRatio="none"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
    >
      <rect width={S} height={100} fill="var(--paper-2)" />
      <line x1={0} y1={50} x2={S} y2={50} stroke="var(--ink)" strokeWidth={0.1} opacity={0.25} />
      {bars.map((h, i) => (
        <rect key={i} x={i + 0.2} y={50 - h / 2} width={0.6} height={h} fill={p[0]} opacity={1} />
      ))}
    </svg>
  );
}

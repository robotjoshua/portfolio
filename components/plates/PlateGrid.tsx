import { rnd } from '@/lib/rnd';
import type { PlateProps } from './types';

export function PlateGrid({ seed: s, palette: p }: PlateProps) {
  const c = 8 + Math.floor(rnd(s, 1) * 6);
  const f: number[] = [];
  for (let i = 0; i < c * c; i++) if (rnd(s, 10 + i) < 0.26) f.push(i);
  return (
    <svg
      viewBox={`0 0 ${c} ${c}`}
      preserveAspectRatio="none"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
    >
      <rect width={c} height={c} fill="var(--paper-2)" />
      {Array.from({ length: c - 1 }).flatMap((_, i) => [
        <line key={`v${i}`} x1={i + 1} y1={0} x2={i + 1} y2={c} stroke="var(--ink)" strokeWidth={0.03} opacity={0.25} />,
        <line key={`h${i}`} x1={0} y1={i + 1} x2={c} y2={i + 1} stroke="var(--ink)" strokeWidth={0.03} opacity={0.25} />,
      ])}
      {f.map((i) => (
        <rect key={i} x={i % c} y={Math.floor(i / c)} width={1} height={1} fill={p[0]} opacity={1} />
      ))}
    </svg>
  );
}

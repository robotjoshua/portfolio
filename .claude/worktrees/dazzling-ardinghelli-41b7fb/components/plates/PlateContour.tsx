import { rnd } from '@/lib/rnd';
import type { PlateProps } from './types';

export function PlateContour({ seed: s, palette: p }: PlateProps) {
  const paths: string[] = [];
  for (let l = 0; l < 8; l++) {
    const amp = 6 + rnd(s, 30 + l) * 14;
    const freq = 1 + rnd(s, 40 + l) * 3;
    const yo = 10 + l * 11;
    let d = `M 0 ${yo}`;
    for (let x = 0; x <= 100; x += 2) {
      d += ` L ${x} ${yo + Math.sin((x / 100) * Math.PI * freq + rnd(s, 50 + l) * 6) * amp * 0.3}`;
    }
    paths.push(d);
  }
  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
    >
      <rect width={100} height={100} fill="var(--paper-2)" />
      {paths.map((d, i) => (
        <path key={i} d={d} stroke={p[0]} strokeWidth={0.55} fill="none" opacity={0.75 + i * 0.03} />
      ))}
    </svg>
  );
}

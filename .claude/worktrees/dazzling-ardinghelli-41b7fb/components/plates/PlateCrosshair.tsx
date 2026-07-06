import { rnd } from '@/lib/rnd';
import type { PlateProps } from './types';

export function PlateCrosshair({ seed: s, palette: p }: PlateProps) {
  const cx = 30 + rnd(s, 4) * 40;
  const cy = 30 + rnd(s, 5) * 40;
  const targets = Array.from({ length: 3 + Math.floor(rnd(s, 6) * 4) }, (_, i) => ({
    x: rnd(s, 70 + i) * 100,
    y: rnd(s, 170 + i) * 100,
    r: 1 + rnd(s, 270 + i) * 2,
  }));
  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
    >
      <rect width={100} height={100} fill="var(--paper-2)" />
      {Array.from({ length: 9 }).flatMap((_, i) => [
        <line key={`v${i}`} x1={(i + 1) * 10} y1={0} x2={(i + 1) * 10} y2={100} stroke="var(--ink)" strokeWidth={0.1} opacity={0.15} />,
        <line key={`h${i}`} x1={0} y1={(i + 1) * 10} x2={100} y2={(i + 1) * 10} stroke="var(--ink)" strokeWidth={0.1} opacity={0.15} />,
      ])}
      {targets.map((t, i) => (
        <circle key={i} cx={t.x} cy={t.y} r={t.r} stroke={p[0]} strokeWidth={0.3} fill="none" opacity={0.8} />
      ))}
      <line x1={cx} y1={0} x2={cx} y2={100} stroke={p[1]} strokeWidth={0.4} />
      <line x1={0} y1={cy} x2={100} y2={cy} stroke={p[1]} strokeWidth={0.4} />
      <circle cx={cx} cy={cy} r={5} stroke={p[1]} strokeWidth={0.5} fill="none" />
      <circle cx={cx} cy={cy} r={1.5} fill={p[1]} />
    </svg>
  );
}

import { rnd } from '@/lib/rnd';
import type { PlateProps } from './types';

export function PlateCircuit({ seed: s, palette: p }: PlateProps) {
  const nodes = Array.from({ length: 8 + Math.floor(rnd(s, 90) * 6) }, (_, i) => ({
    x: 10 + rnd(s, 2000 + i) * 80,
    y: 10 + rnd(s, 2100 + i) * 80,
  }));
  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
    >
      <rect width={100} height={100} fill="var(--paper-2)" />
      {nodes.slice(0, -1).map((n, i) => {
        const nx = nodes[i + 1];
        const mid = rnd(s, 2200 + i) > 0.5;
        return (
          <polyline
            key={i}
            points={`${n.x},${n.y} ${mid ? nx.x : n.x},${mid ? n.y : nx.y} ${nx.x},${nx.y}`}
            stroke={p[0]}
            strokeWidth={0.45}
            fill="none"
            opacity={0.85}
          />
        );
      })}
      {nodes.map((n, i) => (
        <circle key={i} cx={n.x} cy={n.y} r={1.6} fill={i % 3 === 0 ? p[1] : p[0]} opacity={1} />
      ))}
    </svg>
  );
}

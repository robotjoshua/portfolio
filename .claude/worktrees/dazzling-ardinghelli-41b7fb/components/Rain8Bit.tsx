'use client';

type Drop = { x: number; w: number; h: number; d: number; s: number };

const DROPS: Drop[] = [
  { x: 1, w: 1, h: 4, d: 0.12, s: 1.0 },
  { x: 2, w: 1, h: 3, d: 0.68, s: 1.25 },
  { x: 3, w: 1, h: 5, d: 0.34, s: 0.9 },
  { x: 4, w: 1, h: 3, d: 0.91, s: 1.1 },
  { x: 5, w: 2, h: 4, d: 0.22, s: 1.05 },
  { x: 7, w: 1, h: 3, d: 0.55, s: 1.2 },
  { x: 8, w: 1, h: 5, d: 0.08, s: 0.95 },
  { x: 9, w: 1, h: 4, d: 0.74, s: 1.15 },
  { x: 10, w: 1, h: 2, d: 0.41, s: 1.3 },
  { x: 11, w: 2, h: 6, d: 0.83, s: 0.85 },
  { x: 13, w: 1, h: 3, d: 0.17, s: 1.1 },
  { x: 14, w: 1, h: 5, d: 0.6, s: 1.0 },
  { x: 15, w: 1, h: 4, d: 0.29, s: 1.2 },
  { x: 16, w: 1, h: 3, d: 0.77, s: 0.9 },
  { x: 17, w: 1, h: 2, d: 0.05, s: 1.25 },
  { x: 18, w: 2, h: 5, d: 0.52, s: 0.95 },
  { x: 20, w: 1, h: 4, d: 0.88, s: 1.1 },
  { x: 21, w: 1, h: 3, d: 0.31, s: 1.15 },
  { x: 22, w: 1, h: 5, d: 0.66, s: 1.0 },
  { x: 23, w: 1, h: 2, d: 0.14, s: 1.3 },
  { x: 24, w: 1, h: 4, d: 0.47, s: 0.88 },
  { x: 25, w: 2, h: 6, d: 0.79, s: 1.05 },
  { x: 27, w: 1, h: 3, d: 0.02, s: 1.2 },
  { x: 28, w: 1, h: 5, d: 0.58, s: 0.95 },
  { x: 29, w: 1, h: 4, d: 0.25, s: 1.1 },
  { x: 30, w: 1, h: 2, d: 0.72, s: 1.25 },
  { x: 31, w: 1, h: 3, d: 0.09, s: 1.0 },
  { x: 32, w: 2, h: 5, d: 0.44, s: 0.9 },
  { x: 34, w: 1, h: 4, d: 0.86, s: 1.15 },
  { x: 35, w: 1, h: 3, d: 0.19, s: 1.2 },
  { x: 36, w: 1, h: 6, d: 0.62, s: 0.85 },
  { x: 37, w: 1, h: 4, d: 0.35, s: 1.0 },
  { x: 38, w: 1, h: 2, d: 0.81, s: 1.3 },
  { x: 39, w: 2, h: 5, d: 0.11, s: 0.95 },
  { x: 41, w: 1, h: 4, d: 0.53, s: 1.1 },
  { x: 42, w: 1, h: 3, d: 0.97, s: 1.2 },
  { x: 43, w: 1, h: 5, d: 0.27, s: 1.0 },
  { x: 44, w: 1, h: 3, d: 0.71, s: 0.88 },
  { x: 45, w: 1, h: 4, d: 0.15, s: 1.15 },
  { x: 46, w: 2, h: 6, d: 0.49, s: 0.92 },
  { x: 0, w: 1, h: 3, d: 0.38, s: 1.05 },
  { x: 6, w: 1, h: 6, d: 0.64, s: 0.87 },
  { x: 12, w: 1, h: 2, d: 0.95, s: 1.25 },
  { x: 19, w: 1, h: 5, d: 0.21, s: 1.0 },
  { x: 26, w: 1, h: 3, d: 0.57, s: 1.2 },
  { x: 33, w: 1, h: 5, d: 0.03, s: 0.93 },
  { x: 40, w: 1, h: 2, d: 0.85, s: 1.3 },
  { x: 47, w: 1, h: 4, d: 0.42, s: 1.08 },
];

export function Rain8Bit() {
  return (
    <div className="r8-wrap" aria-hidden="true">
      <svg
        viewBox="0 0 48 32"
        preserveAspectRatio="xMidYMid slice"
        className="r8-svg"
        shapeRendering="crispEdges"
      >
        {DROPS.map((d, i) => (
          <rect
            key={i}
            x={d.x}
            y="0"
            width={d.w}
            height={d.h}
            className="r8-drop"
            style={{
              animationDelay: `${-d.d * d.s * 3}s`,
              animationDuration: `${d.s * 3}s`,
            }}
          />
        ))}
      </svg>
    </div>
  );
}

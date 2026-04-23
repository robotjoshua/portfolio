'use client';
import { useEffect, useState } from 'react';

type Point = {
  k: string;
  unit?: string;
  min: number;
  max: number;
  digits?: number;
};

const POINTS: Point[] = [
  { k: 'KILN·RUN', unit: 'hr', min: 18, max: 72, digits: 1 },
  { k: 'PSI·IDLE', min: 8.2, max: 12.4, digits: 1 },
  { k: 'CNC·RUN', unit: '%', min: 42, max: 68, digits: 0 },
  { k: 'ARC·MIN', min: 112, max: 186, digits: 0 },
  { k: 'PLA·SPL', unit: 'g', min: 220, max: 460, digits: 0 },
  { k: 'LUX·AVG', min: 1820, max: 2240, digits: 0 },
  { k: 'FLUX·RPM', min: 3.12, max: 4.88, digits: 2 },
  { k: 'YLD·PCT', unit: '%', min: 86.2, max: 97.4, digits: 1 },
  { k: 'TOL·μm', min: 18, max: 42, digits: 0 },
  { k: 'AMP·DRW', min: 6.4, max: 11.2, digits: 1 },
  { k: 'DWELL·S', min: 4.1, max: 9.6, digits: 1 },
  { k: 'ETA·MIN', min: 24, max: 186, digits: 0 },
  { k: 'CAL·OK', unit: '%', min: 99.1, max: 99.9, digits: 2 },
  { k: 'ABS·VAR', min: 0.08, max: 0.42, digits: 2 },
];

function roll(p: Point) {
  const n = p.min + Math.random() * (p.max - p.min);
  return n.toFixed(p.digits ?? 0);
}

export function DataTicker() {
  const [vals, setVals] = useState<string[]>(() => POINTS.map((p) => '—'.repeat(Math.max(2, String(p.max | 0).length))));

  useEffect(() => {
    setVals(POINTS.map(roll));
    const id = setInterval(() => {
      setVals((prev) => {
        const next = [...prev];
        const swaps = 2 + Math.floor(Math.random() * 2);
        for (let i = 0; i < swaps; i++) {
          const idx = Math.floor(Math.random() * POINTS.length);
          next[idx] = roll(POINTS[idx]);
        }
        return next;
      });
    }, 1400);
    return () => clearInterval(id);
  }, []);

  const entries = POINTS.map((p, i) => (
    <span key={p.k} className="dt-cell">
      <span className="dt-k">{p.k}</span>
      <span className="dt-v">
        {vals[i]}
        {p.unit && <span className="dt-u">{p.unit}</span>}
      </span>
    </span>
  ));

  return (
    <div className="dt-bar" aria-hidden="true">
      <div className="dt-track">
        <div className="dt-row">{entries}</div>
        <div className="dt-row">{entries}</div>
      </div>
    </div>
  );
}

'use client';
import { useEffect, useRef, useState } from 'react';

type Metric = {
  k: string;
  fmt: (n: number) => string;
  min: number;
  max: number;
};

const POOL: Metric[] = [
  { k: 'KILN·RUN', min: 18, max: 72, fmt: (n) => `${n.toFixed(1)}hr` },
  { k: 'PSI·IDLE', min: 8.2, max: 12.4, fmt: (n) => n.toFixed(1) },
  { k: 'CNC·RUN', min: 42, max: 68, fmt: (n) => `${n.toFixed(0)}%` },
  { k: 'ARC·DWELL', min: 4.1, max: 9.6, fmt: (n) => `${n.toFixed(1)}s` },
  { k: 'PLA·SPOOL', min: 220, max: 460, fmt: (n) => `${n.toFixed(0)}g` },
  { k: 'LUX·AVG', min: 1820, max: 2240, fmt: (n) => n.toFixed(0) },
  { k: 'FLUX·RPM', min: 3.12, max: 4.88, fmt: (n) => n.toFixed(2) },
  { k: 'YIELD·PCT', min: 86.2, max: 97.4, fmt: (n) => `${n.toFixed(1)}%` },
  { k: 'TOL·μm', min: 18, max: 42, fmt: (n) => n.toFixed(0) },
  { k: 'AMP·DRAW', min: 6.4, max: 11.2, fmt: (n) => `${n.toFixed(1)}A` },
  { k: 'ETA·MIN', min: 24, max: 186, fmt: (n) => n.toFixed(0) },
  { k: 'CAL·DRIFT', min: 0.04, max: 0.42, fmt: (n) => n.toFixed(2) },
  { k: 'TORQUE·Nm', min: 14.2, max: 38.8, fmt: (n) => n.toFixed(1) },
  { k: 'VIBE·HZ', min: 42, max: 118, fmt: (n) => n.toFixed(0) },
  { k: 'CURE·PCT', min: 62, max: 99, fmt: (n) => `${n.toFixed(0)}%` },
  { k: 'PWR·KW', min: 1.8, max: 6.4, fmt: (n) => n.toFixed(2) },
  { k: 'HRS·UPT', min: 182, max: 4820, fmt: (n) => n.toFixed(0) },
];

const GLYPHS = '0123456789';
const ROWS = 5;

function rand(m: Metric) {
  return m.min + Math.random() * (m.max - m.min);
}

function pickDistinct(n: number, exclude: string[] = []): Metric[] {
  const avail = POOL.filter((p) => !exclude.includes(p.k));
  const out: Metric[] = [];
  const src = [...avail];
  for (let i = 0; i < n && src.length; i++) {
    const idx = Math.floor(Math.random() * src.length);
    out.push(src.splice(idx, 1)[0]);
  }
  return out;
}

export function TelemetryPanel() {
  const [rows, setRows] = useState<{ metric: Metric; value: string; pulse: boolean }[]>(() =>
    POOL.slice(0, ROWS).map((m) => ({ metric: m, value: '—', pulse: false })),
  );
  const reduced = useRef(false);

  useEffect(() => {
    reduced.current =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    setRows(pickDistinct(ROWS).map((m) => ({ metric: m, value: m.fmt(rand(m)), pulse: false })));
  }, []);

  // fast value tick — reroll 1-2 rows every ~500ms
  useEffect(() => {
    const id = setInterval(() => {
      setRows((prev) => {
        const next = prev.slice();
        const swaps = 1 + Math.floor(Math.random() * 2);
        for (let i = 0; i < swaps; i++) {
          const idx = Math.floor(Math.random() * next.length);
          next[idx] = { ...next[idx], value: next[idx].metric.fmt(rand(next[idx].metric)) };
        }
        return next;
      });
    }, 520);
    return () => clearInterval(id);
  }, []);

  // scramble pulse — every ~5s, pick one row and scramble its value
  useEffect(() => {
    if (reduced.current) return;
    let raf = 0;
    const pulseOne = () => {
      setRows((prev) => {
        const idx = Math.floor(Math.random() * prev.length);
        const next = prev.slice();
        next[idx] = { ...next[idx], pulse: true };
        return next;
      });
    };
    const unpulse = (idx: number) => {
      setRows((prev) => {
        const next = prev.slice();
        if (next[idx]) next[idx] = { ...next[idx], pulse: false };
        return next;
      });
    };
    const tick = () => {
      setRows((prev) => {
        const idx = prev.findIndex((r) => r.pulse);
        if (idx < 0) {
          const pickIdx = Math.floor(Math.random() * prev.length);
          const next = prev.slice();
          next[pickIdx] = { ...next[pickIdx], pulse: true };
          return next;
        }
        return prev;
      });
    };
    const id = setInterval(pulseOne, 2800);
    return () => {
      clearInterval(id);
      cancelAnimationFrame(raf);
      // silence unused helpers
      void tick;
      void unpulse;
    };
  }, []);

  // unset pulse shortly after it's triggered so it flashes
  useEffect(() => {
    const anyPulse = rows.some((r) => r.pulse);
    if (!anyPulse) return;
    const id = setTimeout(() => {
      setRows((prev) => prev.map((r) => ({ ...r, pulse: false })));
    }, 380);
    return () => clearTimeout(id);
  }, [rows]);

  // label rotation — every ~9s, swap one row's metric for a different one
  useEffect(() => {
    const id = setInterval(() => {
      setRows((prev) => {
        const idx = Math.floor(Math.random() * prev.length);
        const existing = prev.map((r) => r.metric.k);
        const fresh = pickDistinct(1, existing);
        if (!fresh.length) return prev;
        const next = prev.slice();
        next[idx] = { metric: fresh[0], value: fresh[0].fmt(rand(fresh[0])), pulse: true };
        return next;
      });
    }, 9000);
    return () => clearInterval(id);
  }, []);

  return (
    <div>
      {rows.map((r, i) => (
        <div key={i} className="msr">
          <span className="msr-k">{r.metric.k}</span>
          <span className={`msr-v tp-v${r.pulse ? ' pulse' : ''}`}>
            {r.pulse ? scramble(r.value) : r.value}
          </span>
        </div>
      ))}
    </div>
  );
}

function scramble(v: string) {
  return [...v]
    .map((c) => (/[0-9]/.test(c) ? GLYPHS[Math.floor(Math.random() * GLYPHS.length)] : c))
    .join('');
}

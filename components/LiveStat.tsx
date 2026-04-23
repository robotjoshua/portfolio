'use client';
import { useEffect, useRef, useState } from 'react';

const GLYPHS = '0123456789';

export function LiveStat({
  value,
  marker,
  initialDelayMs = 0,
  pulseEveryMs = 7000,
  scrambleMs = 420,
  markerEveryMs = 1200,
}: {
  value: string;
  marker: { prefix: string; min: number; max: number; digits: number };
  initialDelayMs?: number;
  pulseEveryMs?: number;
  scrambleMs?: number;
  markerEveryMs?: number;
}) {
  const [out, setOut] = useState(value);
  const [pulse, setPulse] = useState(false);
  const [mark, setMark] = useState('');

  const ranRef = useRef(false);
  const reduced = useRef(false);

  useEffect(() => {
    reduced.current =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    const rollMark = () => {
      const n = marker.min + Math.random() * (marker.max - marker.min);
      setMark(`${marker.prefix}${n.toFixed(marker.digits)}`);
    };
    rollMark();
    const mid = setInterval(rollMark, markerEveryMs);
    return () => clearInterval(mid);
  }, [marker, markerEveryMs]);

  useEffect(() => {
    if (reduced.current) {
      setOut(value);
      return;
    }

    let raf = 0;
    let pulseT: ReturnType<typeof setTimeout>;

    const scramble = () => {
      setPulse(true);
      const start = performance.now();
      const chars = [...value];
      const step = (t: number) => {
        const p = Math.min(1, (t - start) / scrambleMs);
        const settled = Math.floor(chars.length * p);
        const next = chars.map((c, i) => {
          if (i < settled || !/[0-9]/.test(c)) return c;
          return GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
        });
        setOut(next.join(''));
        if (p < 1) raf = requestAnimationFrame(step);
        else {
          setOut(value);
          setPulse(false);
        }
      };
      raf = requestAnimationFrame(step);
    };

    const firstT = setTimeout(() => {
      if (!ranRef.current) {
        ranRef.current = true;
        scramble();
      }
      pulseT = setInterval(scramble, pulseEveryMs);
    }, initialDelayMs);

    return () => {
      clearTimeout(firstT);
      clearInterval(pulseT);
      cancelAnimationFrame(raf);
    };
  }, [value, scrambleMs, pulseEveryMs, initialDelayMs]);

  return (
    <span className="ls-wrap">
      <span className={`ls-v${pulse ? ' pulse' : ''}`}>{out}</span>
      <span className="ls-m" aria-hidden="true">{mark}</span>
    </span>
  );
}

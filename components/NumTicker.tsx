'use client';
import { useEffect, useRef, useState } from 'react';

const GLYPHS = '0123456789';

/**
 * Re-animating scramble. Unlike NumScramble, this re-runs whenever
 * `value` changes, and also supports a slow idle "flicker" that
 * continuously rolls a single digit so the readout feels alive.
 */
export function NumTicker({
  value,
  durationMs = 520,
  idle = true,
  className,
}: {
  value: string;
  durationMs?: number;
  idle?: boolean;
  className?: string;
}) {
  const [out, setOut] = useState(value);
  const lastRef = useRef(value);
  const rafRef = useRef(0);
  const idleRef = useRef(0);

  // Scramble on value change
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const prev = lastRef.current;
    lastRef.current = value;
    if (prev === value && out === value) return;

    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setOut(value);
      return;
    }

    const start = performance.now();
    const chars = [...value];
    cancelAnimationFrame(rafRef.current);

    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / durationMs);
      const settled = Math.floor(chars.length * p);
      const next = chars.map((c, i) => {
        if (i < settled || !/[0-9]/.test(c)) return c;
        return GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
      });
      setOut(next.join(''));
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
      else setOut(value);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [value, durationMs]);

  // Idle flicker — occasionally rolls one random digit
  useEffect(() => {
    if (!idle || typeof window === 'undefined') return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

    let alive = true;
    const schedule = () => {
      const delay = 900 + Math.random() * 1800;
      idleRef.current = window.setTimeout(() => {
        if (!alive) return;
        setOut((cur) => {
          const chars = [...cur];
          const digitIdx: number[] = [];
          chars.forEach((c, i) => /[0-9]/.test(c) && digitIdx.push(i));
          if (!digitIdx.length) return cur;
          const pick = digitIdx[Math.floor(Math.random() * digitIdx.length)];
          chars[pick] = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
          return chars.join('');
        });
        // Settle back to true value shortly after
        window.setTimeout(() => {
          if (!alive) return;
          setOut(lastRef.current);
          schedule();
        }, 180);
      }, delay);
    };
    schedule();
    return () => {
      alive = false;
      window.clearTimeout(idleRef.current);
    };
  }, [idle]);

  return (
    <span className={`num-tick${className ? ' ' + className : ''}`}>
      {out}
    </span>
  );
}

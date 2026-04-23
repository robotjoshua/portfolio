'use client';
import { useEffect, useRef, useState } from 'react';

const GLYPHS = '0123456789';

export function NumScramble({
  value,
  durationMs = 420,
  className,
}: {
  value: string;
  durationMs?: number;
  className?: string;
}) {
  const [out, setOut] = useState(value);
  const [settling, setSettling] = useState(true);
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setSettling(false);
      return;
    }

    const start = performance.now();
    const chars = [...value];
    let raf = 0;

    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / durationMs);
      const settled = Math.floor(chars.length * p);
      const next = chars.map((c, i) => {
        if (i < settled || !/[0-9]/.test(c)) return c;
        return GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
      });
      setOut(next.join(''));
      if (p < 1) raf = requestAnimationFrame(tick);
      else {
        setOut(value);
        setSettling(false);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, durationMs]);

  return (
    <span className={`num-scr${className ? ' ' + className : ''}`} data-settling={settling ? '1' : '0'}>
      {out}
    </span>
  );
}

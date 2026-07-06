'use client';
import { useEffect, useRef, useState, type ReactNode } from 'react';

const SCAN_VARIANTS = ['sweep', 'reticle', 'pulse', 'glitch', 'hsweep', 'grid', 'chroma', 'static', 'pixelate', 'xerox'] as const;
type ScanVariant = typeof SCAN_VARIANTS[number];

/**
 * Wraps an artifact plate and plays one of the scan effects — once when the
 * specimen is opened, and again whenever the plate is clicked.
 */
export function ScanFrame({ children }: { children: ReactNode }) {
  const [scanning, setScanning] = useState(false);
  const [scanVar, setScanVar] = useState<ScanVariant>('sweep');
  const [scanKey, setScanKey] = useState(0); // restart keyframes even on repeat variant
  const lastVar = useRef<ScanVariant>('sweep');
  const endTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function play() {
    // Pick a fresh variant, different from the previous one if possible so
    // rapid clicks don't look like the same effect twice.
    let v = SCAN_VARIANTS[Math.floor(Math.random() * SCAN_VARIANTS.length)];
    if (v === lastVar.current) {
      v = SCAN_VARIANTS[(SCAN_VARIANTS.indexOf(v) + 1) % SCAN_VARIANTS.length];
    }
    lastVar.current = v;

    // Force the scanning class off for a frame so CSS keyframes restart
    // cleanly even when a click lands mid-animation.
    if (endTimer.current) clearTimeout(endTimer.current);
    setScanning(false);
    setScanVar(v);
    setScanKey((k) => k + 1);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setScanning(true);
        endTimer.current = setTimeout(() => setScanning(false), 900);
      });
    });
  }

  useEffect(() => {
    let entry: ReturnType<typeof setTimeout> | null = null;
    if (!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      entry = setTimeout(play, 350);
    }
    return () => {
      if (entry) clearTimeout(entry);
      if (endTimer.current) clearTimeout(endTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className={`arch-scan rc-ab${scanning ? ` scanning scan-${scanVar}` : ''}`}
      onClick={play}
      title="Rescan"
    >
      {/* inline SVG pixel filters used by scan-pixelate variant */}
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden>
        <defs>
          <filter id="rc-pix-32" x="0" y="0">
            <feFlood x="8" y="8" height="16" width="16" />
            <feComposite width="32" height="32" />
            <feTile result="a" />
            <feComposite in="SourceGraphic" in2="a" operator="in" />
            <feMorphology operator="dilate" radius="16" />
          </filter>
          <filter id="rc-pix-16" x="0" y="0">
            <feFlood x="4" y="4" height="8" width="8" />
            <feComposite width="16" height="16" />
            <feTile result="a" />
            <feComposite in="SourceGraphic" in2="a" operator="in" />
            <feMorphology operator="dilate" radius="8" />
          </filter>
          <filter id="rc-pix-8" x="0" y="0">
            <feFlood x="2" y="2" height="4" width="4" />
            <feComposite width="8" height="8" />
            <feTile result="a" />
            <feComposite in="SourceGraphic" in2="a" operator="in" />
            <feMorphology operator="dilate" radius="4" />
          </filter>
          <filter id="rc-pix-4" x="0" y="0">
            <feFlood x="1" y="1" height="2" width="2" />
            <feComposite width="4" height="4" />
            <feTile result="a" />
            <feComposite in="SourceGraphic" in2="a" operator="in" />
            <feMorphology operator="dilate" radius="2" />
          </filter>
        </defs>
      </svg>
      <div className="rc-ab-plate-inner">{children}</div>
      <div className="rc-ab-scan" key={`s1-${scanKey}`} />
      <div className="rc-ab-scan-2" key={`s2-${scanKey}`} />
      <div className="rc-ab-scan-reticle" key={`r-${scanKey}`}>
        <span />
        <span />
        <span />
        <span />
      </div>
      <div className="rc-ab-scan-noise" key={`n-${scanKey}`} />
      <div className="rc-ab-scan-readout" key={`v-${scanKey}`}>
        <span>{scanning ? scanVar.toUpperCase() : ''}</span>
      </div>
    </div>
  );
}

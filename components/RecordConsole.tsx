'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import type { Artifact } from '@/types/artifact';
import { Plate } from './Plate';

const SCAN_VARIANTS = ['sweep', 'reticle', 'pulse', 'glitch', 'hsweep', 'grid', 'chroma', 'static', 'pixelate', 'xerox'] as const;
type ScanVariant = typeof SCAN_VARIANTS[number];

export function RecordConsole({ artifacts }: { artifacts: Artifact[] }) {
  const [idx, setIdx] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanVar, setScanVar] = useState<ScanVariant>('sweep');
  const [scanKey, setScanKey] = useState(0); // restart keyframes even on repeat variant
  const idxRef = useRef(0);
  const scanEndTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setMounted(true);
    if (artifacts.length > 0) {
      const start = Math.floor(Math.random() * artifacts.length);
      idxRef.current = start;
      setIdx(start);
    }
  }, [artifacts.length]);

  function next() {
    // Always fire an effect, even with 0–1 artifacts. With ≥2, advance to a
    // different random artifact. With <2 we still play the scan animation so
    // the click always produces visual feedback.
    if (artifacts.length >= 2) {
      let n = Math.floor(Math.random() * artifacts.length);
      if (n === idxRef.current) n = (n + 1) % artifacts.length;
      idxRef.current = n;
      setIdx(n);
    }

    // Pick a fresh variant, different from the previous one if possible so
    // rapid clicks don't look like the same effect twice.
    let v = SCAN_VARIANTS[Math.floor(Math.random() * SCAN_VARIANTS.length)];
    if (SCAN_VARIANTS.length > 1 && v === scanVar) {
      v = SCAN_VARIANTS[(SCAN_VARIANTS.indexOf(v) + 1) % SCAN_VARIANTS.length];
    }

    // Force the scanning class off for a frame so CSS keyframes restart
    // cleanly even when the same click happens mid-animation.
    if (scanEndTimer.current) clearTimeout(scanEndTimer.current);
    setScanning(false);
    setScanVar(v);
    setScanKey((k) => k + 1);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setScanning(true);
        scanEndTimer.current = setTimeout(() => setScanning(false), 900);
      });
    });
  }

  useEffect(() => () => {
    if (scanEndTimer.current) clearTimeout(scanEndTimer.current);
  }, []);

  const a = artifacts[idx];
  if (!a) {
    return (
      <div className="rc-wrap">
        <div className="rc-panel rc-ab rc-ab-empty">
          <div className="rc-ab-top">
            <span className="rc-ab-top-k">
              <span className="rc-ab-top-t">Analysis Bay</span>
            </span>
            <span className="rc-ab-top-sp">·</span>
            <span className="rc-ab-top-v">SPEC 000 / 000</span>
            <span className="rc-ab-top-fl" />
            <span className="rc-ab-top-v">STATUS IDLE</span>
          </div>
          <div className="rc-ab-empty-body">
            <div className="rc-ab-empty-k">NO SPECIMEN</div>
            <div className="rc-ab-empty-v">Upload images to populate the archive.</div>
          </div>
        </div>
      </div>
    );
  }

  const specNo = mounted ? (idx + 1).toString().padStart(3, '0') : '—';

  return (
    <div className="rc-wrap">
      <div className={`rc-panel rc-ab${scanning ? ` scanning scan-${scanVar}` : ''}`}>
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
        <div className="rc-ab-top">
          <span className="rc-ab-top-k">
            <span className="rc-ab-top-t">Analysis Bay</span>
          </span>
          <span className="rc-ab-top-sp">·</span>
          <span className="rc-ab-top-v">SPEC {specNo} / {artifacts.length.toString().padStart(3, '0')}</span>
          <span className="rc-ab-top-fl" />
          <span className="rc-ab-top-v">STATUS {scanning ? 'SCAN' : 'HOLD'}</span>
        </div>
        <div className="rc-ab-left">
          <div className="rc-ab-plate">
            <span className="rc-ab-corner tl" />
            <span className="rc-ab-corner tr" />
            <span className="rc-ab-corner bl" />
            <span className="rc-ab-corner br" />
            <Link
              href={`/archive/${a.id}`}
              className="rc-ab-plate-inner rc-ab-plate-link"
              aria-label={`Open ${a.title}`}
              title={`Open ${a.title}`}
            >
              <Plate a={a} fit="contain" size="full" priority />
            </Link>
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
            <div className="rc-ab-plate-id">
              <span>{a.id}</span>
            </div>
          </div>
          <div className="rc-ab-ctrl">
            <span className="rc-ab-ctrl-k">SPEC {specNo}</span>
            <button type="button" className="rc-ab-btn" onClick={next}>⟲ SCAN</button>
          </div>
        </div>
        <div className="rc-ab-right">
          <div className="rc-ab-meta">
            {a.kind} · {a.year} · {a.production}
          </div>
          <div className="rc-ab-title">{a.title}</div>
          <div className="rc-ab-notes">
            <div className="rc-ab-note-row">
              <span className="rc-ab-note-k">Material</span>
              <span className="rc-ab-note-v">{a.material}</span>
            </div>
            <div className="rc-ab-note-row">
              <span className="rc-ab-note-k">Finish</span>
              <span className="rc-ab-note-v">{a.finish}</span>
            </div>
            <div className="rc-ab-note-row">
              <span className="rc-ab-note-k">Dims</span>
              <span className="rc-ab-note-v">{a.dims}</span>
            </div>
            <div className="rc-ab-note-row">
              <span className="rc-ab-note-k">Status</span>
              <span className="rc-ab-note-v">{a.status}</span>
            </div>
            <div className="rc-ab-note-row">
              <span className="rc-ab-note-k">Palette</span>
              <div className="rc-ab-note-pal">
                {a.palette.slice(0, 5).map((c, i) => (
                  <span key={i} className="rc-ab-note-sw" style={{ background: c }} />
                ))}
                <span className="rc-ab-note-v">{a.palette.slice(0, 3).join(' · ').toUpperCase()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

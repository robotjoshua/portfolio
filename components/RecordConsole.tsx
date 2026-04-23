'use client';
import { useEffect, useRef, useState } from 'react';
import type { Artifact } from '@/types/artifact';
import { Plate } from './Plate';

function useTick(interval: number) {
  const [t, setT] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setT((x) => x + 1), interval);
    return () => clearInterval(id);
  }, [interval]);
  return t;
}

function seedRand(seed: number) {
  let s = seed | 0;
  return () => {
    s = (s * 1664525 + 1013904223) | 0;
    return ((s >>> 0) % 10000) / 10000;
  };
}

function Sparkline({ seed, color = 'var(--ink)' }: { seed: number; color?: string }) {
  const tick = useTick(1200);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const N = 32;
  if (!mounted) return <svg viewBox="0 0 120 40" className="sk-svg" />;
  const r = seedRand(seed + tick);
  const ghostR = seedRand(seed + tick - 1);
  const pts: number[] = [];
  const ghost: number[] = [];
  for (let i = 0; i < N; i++) {
    pts.push(r());
    ghost.push(ghostR());
  }
  const toD = (arr: number[]) =>
    arr.map((v, i) => `${i === 0 ? 'M' : 'L'} ${(i / (N - 1)) * 118 + 1} ${38 - v * 32 - 2}`).join(' ');
  const last = pts[N - 1];
  const lastX = 119;
  const lastY = 38 - last * 32 - 2;
  const mn = Math.min(...pts).toFixed(2);
  const mx = Math.max(...pts).toFixed(2);
  return (
    <svg viewBox="0 0 120 40" className="sk-svg" preserveAspectRatio="none">
      <g stroke="var(--rule-3)" strokeWidth={0.3}>
        <line x1="0" y1="6" x2="120" y2="6" strokeDasharray="1 2" />
        <line x1="0" y1="22" x2="120" y2="22" strokeDasharray="1 2" />
        <line x1="0" y1="34" x2="120" y2="34" strokeDasharray="1 2" />
      </g>
      <g stroke="var(--rule-2)" strokeWidth={0.4}>
        {Array.from({ length: 9 }).map((_, i) => (
          <line key={i} x1={i * 15 + 1} y1="36" x2={i * 15 + 1} y2="39" />
        ))}
      </g>
      <path d={toD(ghost)} fill="none" stroke="var(--muted)" strokeWidth={0.6} strokeDasharray="1.5 1.5" opacity={0.5} />
      <path d={toD(pts)} fill="none" stroke={color} strokeWidth={1.1} />
      <circle cx={lastX} cy={lastY} r={1.6} fill={color} />
      <circle cx={lastX} cy={lastY} r={3} fill="none" stroke={color} strokeWidth={0.4} opacity={0.5} />
      <text x="1" y="5" fontFamily="var(--f-m)" fontSize="3" fill="var(--muted)" letterSpacing=".04em">MAX {mx}</text>
      <text x="1" y="39" fontFamily="var(--f-m)" fontSize="3" fill="var(--muted)" letterSpacing=".04em">MIN {mn}</text>
    </svg>
  );
}

function Bars({ seed, count = 12, showThreshold = true }: { seed: number; count?: number; showThreshold?: boolean }) {
  const tick = useTick(1500);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="bars" />;
  const r = seedRand(seed + tick);
  const bars = Array.from({ length: count }, () => Math.max(0.08, r()));
  const peakIdx = bars.indexOf(Math.max(...bars));
  return (
    <div className="bars">
      {showThreshold && <div className="bars-thr" style={{ bottom: '72%' }}><span>THR</span></div>}
      {bars.map((b, i) => (
        <div key={i} className={`bars-b${i === peakIdx ? ' pk' : ''}`} style={{ height: `${b * 100}%` }}>
          {i === peakIdx && <span className="bars-pk-lab">◆</span>}
        </div>
      ))}
    </div>
  );
}

function Readout({ label, seed, unit, dec = 2, showBar = true }: { label: string; seed: number; unit: string; dec?: number; showBar?: boolean }) {
  const tick = useTick(900);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const r = seedRand(seed + tick);
  const raw = mounted ? 10 + r() * 90 : 0;
  const prev = mounted ? 10 + seedRand(seed + tick - 1)() * 90 : 0;
  const value = mounted ? raw.toFixed(dec) : '—';
  const delta = mounted ? raw - prev : 0;
  return (
    <div className="rc-ro">
      <div className="rc-ro-h">
        <span className="rc-ro-k">{label}</span>
        {mounted && (
          <span className={`rc-ro-d ${delta >= 0 ? 'up' : 'dn'}`}>
            {delta >= 0 ? '▲' : '▼'}
            {Math.abs(delta).toFixed(1)}
          </span>
        )}
      </div>
      <div className="rc-ro-v">
        {value}
        <span className="rc-ro-u">{unit}</span>
      </div>
      {showBar && (
        <div className="rc-ro-bar">
          <div className="rc-ro-bar-fill" style={{ width: `${mounted ? raw : 0}%` }} />
        </div>
      )}
    </div>
  );
}

function EventLog({ artifacts }: { artifacts: Artifact[] }) {
  const tick = useTick(2400);
  const [mounted, setMounted] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  useEffect(() => setMounted(true), []);

  const items = Array.from({ length: 14 }).map((_, i) => {
    const r = seedRand(i * 13 + tick);
    const a = artifacts[Math.floor(r() * artifacts.length)];
    const type = r() > 0.6 ? 'SCAN' : r() > 0.3 ? 'CURE' : 'QC';
    const delta = (r() * 40 - 20).toFixed(2);
    const t = mounted
      ? new Date(Date.now() - i * 47000).toISOString().slice(11, 19)
      : '--:--:--';
    return { id: `${i}-${a?.id ?? 'x'}`, t, type, delta, a };
  });

  return (
    <div className="rc-log" ref={scroller}>
      {items.map((x) => (
        <div key={x.id} className="rc-log-row">
          <span className="rc-log-t">{x.t}</span>
          <span className={`rc-log-ty ty-${x.type.toLowerCase()}`}>{x.type}</span>
          <span className="rc-log-id">{x.a?.id ?? '—'}</span>
          <span className="rc-log-d">{Number(x.delta) > 0 ? '+' : ''}{x.delta}σ</span>
        </div>
      ))}
    </div>
  );
}

function MicroDial({ seed }: { seed: number }) {
  const tick = useTick(900);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const r = seedRand(seed + tick);
  const v = mounted ? r() : 0.5;
  const angle = -120 + v * 240;
  const label = mounted ? (v * 100).toFixed(1) : '—';
  return (
    <div className="md-wrap">
      <svg viewBox="0 0 60 38" className="md-svg" preserveAspectRatio="xMidYMid meet">
        <g stroke="var(--rule-2)" strokeWidth="0.5" fill="none">
          <path d="M 8 32 A 22 22 0 0 1 52 32" />
        </g>
        {Array.from({ length: 13 }).map((_, i) => {
          const a = (-120 + (i / 12) * 240) * Math.PI / 180;
          const x1 = 30 + Math.cos(a) * 22;
          const y1 = 32 + Math.sin(a) * 22;
          const x2 = 30 + Math.cos(a) * (i % 3 === 0 ? 18 : 20);
          const y2 = 32 + Math.sin(a) * (i % 3 === 0 ? 18 : 20);
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--muted)" strokeWidth="0.3" />;
        })}
        {mounted && (
          <g>
            <line
              x1="30"
              y1="32"
              x2={30 + Math.cos((angle * Math.PI) / 180) * 20}
              y2={32 + Math.sin((angle * Math.PI) / 180) * 20}
              stroke="var(--ink)"
              strokeWidth="0.8"
            />
            <circle cx="30" cy="32" r="1.5" fill="var(--ink)" />
          </g>
        )}
      </svg>
      <div className="md-val">{label}<span className="md-u">%</span></div>
    </div>
  );
}

function MicroMatrix({ seed, rows, cols }: { seed: number; rows: number; cols: number }) {
  const tick = useTick(700);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const r = seedRand(seed + tick);
  const cells: number[] = [];
  for (let i = 0; i < rows * cols; i++) cells.push(mounted ? r() : 0);
  return (
    <div className="mm-wrap" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
      {cells.map((v, i) => (
        <span key={i} className="mm-c" style={{ opacity: 0.15 + v * 0.85 }} />
      ))}
    </div>
  );
}

function Crosshair({ seed }: { seed: number }) {
  const tick = useTick(1800);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const r = seedRand(seed + tick);
  const x = mounted ? 12 + r() * 76 : 50;
  const y = mounted ? 12 + r() * 76 : 50;
  const xs = x.toFixed(2);
  const ys = y.toFixed(2);
  return (
    <svg viewBox="0 0 100 100" className="xh-svg" preserveAspectRatio="none">
      <defs>
        <pattern id="gridFine" width="2" height="2" patternUnits="userSpaceOnUse">
          <path d="M 2 0 L 0 0 0 2" fill="none" stroke="var(--rule-3)" strokeWidth="0.08" />
        </pattern>
        <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
          <path d="M 10 0 L 0 0 0 10" fill="none" stroke="var(--rule-3)" strokeWidth="0.25" />
        </pattern>
      </defs>
      <rect width="100" height="100" fill="url(#gridFine)" />
      <rect width="100" height="100" fill="url(#grid)" />
      <g stroke="var(--muted)" strokeWidth={0.2} fill="none" opacity={0.4}>
        <line x1="0" y1="50" x2="100" y2="50" strokeDasharray="0.5 1" />
        <line x1="50" y1="0" x2="50" y2="100" strokeDasharray="0.5 1" />
      </g>
      {Array.from({ length: 11 }).map((_, i) => (
        <g key={i}>
          <line x1={i * 10} y1="0" x2={i * 10} y2={i % 5 === 0 ? 2 : 1} stroke="var(--muted)" strokeWidth="0.2" />
          <line x1="0" y1={i * 10} x2={i % 5 === 0 ? 2 : 1} y2={i * 10} stroke="var(--muted)" strokeWidth="0.2" />
        </g>
      ))}
      <g stroke="var(--ink)" strokeWidth={0.3} fill="none" opacity={0.7}>
        <path d="M 1 4 L 1 1 L 4 1" />
        <path d="M 99 4 L 99 1 L 96 1" />
        <path d="M 1 96 L 1 99 L 4 99" />
        <path d="M 99 96 L 99 99 L 96 99" />
      </g>
      <line x1={x} y1="0" x2={x} y2="100" stroke="var(--ink)" strokeWidth="0.25" opacity="0.55" strokeDasharray="1 0.6" />
      <line x1="0" y1={y} x2="100" y2={y} stroke="var(--ink)" strokeWidth="0.25" opacity="0.55" strokeDasharray="1 0.6" />
      <circle cx={x} cy={y} r="7" fill="none" stroke="var(--ink)" strokeWidth="0.2" opacity="0.35" strokeDasharray="1 1" />
      <circle cx={x} cy={y} r="3.5" fill="none" stroke="var(--ink)" strokeWidth="0.35" />
      <circle cx={x} cy={y} r="0.7" fill="var(--ink)" />
      <g stroke="var(--ink)" strokeWidth="0.35" fill="none">
        <line x1={x - 5} y1={y} x2={x - 2} y2={y} />
        <line x1={x + 2} y1={y} x2={x + 5} y2={y} />
        <line x1={x} y1={y - 5} x2={x} y2={y - 2} />
        <line x1={x} y1={y + 2} x2={x} y2={y + 5} />
      </g>
      <text x={Math.min(x + 4.5, 78)} y={y - 2.5} fontFamily="var(--f-m)" fontSize="2.4" fill="var(--ink)" letterSpacing=".05em">[{xs},{ys}]</text>
      <text x="1.5" y="97" fontFamily="var(--f-m)" fontSize="2.2" fill="var(--muted)" letterSpacing=".14em">X · MM</text>
      <text x="98.5" y="97" fontFamily="var(--f-m)" fontSize="2.2" fill="var(--muted)" letterSpacing=".14em" textAnchor="end">LOCK · {mounted ? 'A' : '—'}</text>
      <text x="1.5" y="4" fontFamily="var(--f-m)" fontSize="2.2" fill="var(--muted)" letterSpacing=".14em">Y · MM</text>
    </svg>
  );
}

function AnalysisBay({ artifacts }: { artifacts: Artifact[] }) {
  const [idx, setIdx] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [scanning, setScanning] = useState(false);
  const idxRef = useRef(0);
  const tick = useTick(1400);

  useEffect(() => {
    setMounted(true);
    if (artifacts.length > 0) {
      const start = Math.floor(Math.random() * artifacts.length);
      idxRef.current = start;
      setIdx(start);
    }
  }, [artifacts.length]);

  function next() {
    if (artifacts.length < 2) return;
    const n = (idxRef.current + 1) % artifacts.length;
    idxRef.current = n;
    setScanning(true);
    setIdx(n);
    setTimeout(() => setScanning(false), 260);
  }

  const a = artifacts[idx];
  if (!a) {
    return (
      <div className="rc-panel rc-ab rc-ab-empty">
        <div className="rc-ab-top">
          <span className="rc-ab-top-k">CH.00 · ANALYSIS BAY</span>
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
    );
  }
  const r = seedRand(idx * 37 + tick);
  const massN = mounted ? 50 + r() * 180 : 0;
  const integN = mounted ? 82 + r() * 17 : 0;
  const stressN = mounted ? r() * 100 : 0;
  const tempN = mounted ? 20 + r() * 8 : 0;
  const rhoN = mounted ? 0.8 + r() * 1.4 : 0;
  const resN = mounted ? r() * 500 : 0;
  const mass = mounted ? massN.toFixed(2) : '—';
  const integ = mounted ? integN.toFixed(1) : '—';
  const stress = mounted ? stressN.toFixed(2) : '—';
  const temp = mounted ? tempN.toFixed(1) : '—';
  const rho = mounted ? rhoN.toFixed(3) : '—';
  const res = mounted ? resN.toFixed(1) : '—';
  const phases = ['ACQ', 'FILT', 'XRAY', 'MASS', 'VIB', 'LOG'];
  const phaseIdx = tick % phases.length;

  const cells: { k: string; v: string; u: string; pct: number }[] = [
    { k: 'Mass', v: mass, u: 'g', pct: (massN / 230) * 100 },
    { k: 'Integrity', v: integ, u: '%', pct: integN },
    { k: 'Stress', v: stress, u: 'MPa', pct: stressN },
    { k: 'Dwell', v: temp, u: 's', pct: ((tempN - 20) / 8) * 100 },
    { k: 'ρ', v: rho, u: 'g/cm³', pct: ((rhoN - 0.8) / 1.4) * 100 },
    { k: 'Resonance', v: res, u: 'Hz', pct: (resN / 500) * 100 },
  ];

  return (
    <div className={`rc-panel rc-ab${scanning ? ' scanning' : ''}`}>
      <div className="rc-ab-top">
        <span className="rc-ab-top-k">CH.00 · ANALYSIS BAY</span>
        <span className="rc-ab-top-sp">·</span>
        <span className="rc-ab-top-v">SPEC {mounted ? (idx + 1).toString().padStart(3, '0') : '—'} / {artifacts.length.toString().padStart(3, '0')}</span>
        <span className="rc-ab-top-sp">·</span>
        <span className="rc-ab-top-v">PHASE {phases[phaseIdx]}</span>
        <span className="rc-ab-top-fl" />
        <span className="rc-ab-top-v">STATUS {scanning ? 'SCAN' : 'HOLD'}</span>
        <button type="button" className="rc-ab-btn" onClick={next}>⟲ SCAN</button>
      </div>
      <div className="rc-ab-left">
        <div className="rc-ab-plate">
          <span className="rc-ab-corner tl" />
          <span className="rc-ab-corner tr" />
          <span className="rc-ab-corner bl" />
          <span className="rc-ab-corner br" />
          <Plate a={a} />
          <div className="rc-ab-scan" />
          <div className="rc-ab-plate-id">
            <span>{a.id}</span>
            <span>{a.catNo}</span>
          </div>
        </div>
      </div>
      <div className="rc-ab-right">
        <div className="rc-ab-meta">
          {a.kind} · {a.year} · {a.production}
        </div>
        <div className="rc-ab-title">{a.title}</div>
        <div className="rc-ab-grid">
          {cells.map((c) => (
            <div key={c.k} className="rc-ab-cell">
              <div className="rc-ab-ch">
                <span className="rc-ab-k">{c.k}</span>
                <span className="rc-ab-pct">{mounted ? Math.min(99, Math.max(0, c.pct)).toFixed(0).padStart(2, '0') : '—'}</span>
              </div>
              <div className="rc-ab-v">{c.v}<span className="rc-ab-u">{c.u}</span></div>
              <div className="rc-ab-bar"><div className="rc-ab-bar-f" style={{ width: `${mounted ? Math.min(100, Math.max(0, c.pct)) : 0}%` }} /></div>
            </div>
          ))}
        </div>
        <div className="rc-ab-panel">
          <div className="rc-ab-panel-h">
            <span className="rc-ab-panel-k">Waveform · Resonance Trace</span>
            <span className="rc-ab-panel-v">Δ {mounted ? (resN / 10).toFixed(2) : '—'} Hz</span>
          </div>
          <Sparkline seed={idx * 11 + 41} />
        </div>
        <div className="rc-ab-notes">
          <div className="rc-ab-note-row">
            <span className="rc-ab-note-k">Palette</span>
            <div className="rc-ab-note-pal">
              {a.palette.slice(0, 5).map((c, i) => (
                <span key={i} className="rc-ab-note-sw" style={{ background: c }} />
              ))}
              <span className="rc-ab-note-v">{a.palette.slice(0, 3).join(' · ').toUpperCase()}</span>
            </div>
          </div>
          <div className="rc-ab-note-row">
            <span className="rc-ab-note-k">Status</span>
            <span className="rc-ab-note-v">{a.status} · Cat. No. {a.catNo}</span>
          </div>
        </div>
        <div className="rc-ab-foot">
          <span className="rc-ab-f-k">Material</span>
          <span className="rc-ab-f-v">{a.material}</span>
          <span className="rc-ab-f-sep">·</span>
          <span className="rc-ab-f-k">Finish</span>
          <span className="rc-ab-f-v">{a.finish}</span>
          <span className="rc-ab-f-sep">·</span>
          <span className="rc-ab-f-k">Dims</span>
          <span className="rc-ab-f-v">{a.dims}</span>
        </div>
      </div>
    </div>
  );
}

function Rail({ side, seed }: { side: 'l' | 'r'; seed: number }) {
  const tick = useTick(1100);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const N = 22;
  const r = seedRand(seed + tick);
  const rows: { k: string; v: string }[] = [];
  const keys = ['ACQ', 'MAG', 'LUX', 'RSN', 'VIB', 'TOL', 'CAL', 'FLX', 'HZ', 'KV', 'TMP', 'PSI', 'RPM', 'AMP', 'OHM', 'DWL', 'ETA', 'ABS', 'MIN', 'MAX', 'AVG', 'DEV'];
  for (let i = 0; i < N; i++) {
    const v = mounted ? (r() * 1000).toFixed(2) : '—';
    rows.push({ k: keys[i % keys.length], v });
  }
  return (
    <aside className={`rc-rail rc-rail-${side}`}>
      {rows.map((row, i) => (
        <div key={i} className="rc-rail-row">
          <span className="rc-rail-k">{row.k}</span>
          <span className="rc-rail-v">{row.v}</span>
        </div>
      ))}
    </aside>
  );
}

export function RecordConsole({ artifacts }: { artifacts: Artifact[] }) {
  return (
    <div className="rc-wrap">
      <Rail side="l" seed={9991} />
      <div className="rc-canvas">
      <div className="rc-grid">
        <AnalysisBay artifacts={artifacts} />
        <div className="rc-panel rc-p-a">
          <div className="rc-h">
            <span>CH.01 · Kiln Runtime</span>
            <span className="rc-live">● Live</span>
          </div>
          <div className="rc-big">
            4<span className="rc-big-split">1</span>2
            <span className="rc-big-u">hr</span>
          </div>
          <Sparkline seed={101} />
          <div className="rc-foot">
            <Readout label="Δ30m" seed={11} unit="" dec={1} />
            <Readout label="σ" seed={12} unit="" dec={2} />
            <Readout label="Peak" seed={13} unit="" dec={0} />
          </div>
        </div>

        <div className="rc-panel rc-p-b">
          <div className="rc-h">
            <span>CH.02 · Spectral Scan</span>
            <span className="rc-live">● Live</span>
          </div>
          <Bars seed={202} count={22} />
          <div className="rc-foot">
            <Readout label="Band" seed={21} unit="Hz" dec={1} />
            <Readout label="Gain" seed={22} unit="dB" dec={2} />
          </div>
        </div>

        <div className="rc-panel rc-p-c">
          <div className="rc-h">
            <span>CH.03 · Origin Track</span>
            <span className="rc-live">● Live</span>
          </div>
          <Crosshair seed={303} />
          <div className="rc-foot">
            <Readout label="X" seed={31} unit="mm" dec={2} />
            <Readout label="Y" seed={32} unit="mm" dec={2} />
          </div>
        </div>

        <div className="rc-panel rc-p-d">
          <div className="rc-h">
            <span>CH.04 · Event Log</span>
            <span className="rc-live">● Live</span>
          </div>
          <EventLog artifacts={artifacts} />
        </div>

        <div className="rc-panel rc-p-e">
          <div className="rc-h">
            <span>CH.05 · Flux</span>
            <span className="rc-live">● Live</span>
          </div>
          <Sparkline seed={505} color="var(--accent)" />
          <div className="rc-foot">
            <Readout label="RPM" seed={51} unit="" dec={2} />
            <Readout label="Torq" seed={52} unit="Nm" dec={1} />
          </div>
        </div>

        <div className="rc-panel rc-p-f">
          <div className="rc-h">
            <span>CH.06 · Archive</span>
            <span className="rc-sub">{artifacts.length}</span>
          </div>
          <div className="rc-stat">
            <div className="rc-stat-v">{String(artifacts.length).padStart(3, '0')}</div>
            <div className="rc-stat-k">idx</div>
          </div>
          <Bars seed={606} count={artifacts.length || 12} showThreshold={false} />
        </div>
      </div>
      </div>
      <Rail side="r" seed={7773} />
    </div>
  );
}

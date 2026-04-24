'use client';
import { useEffect, useState } from 'react';

// Repeating "broadcast" fragments that stream across the nav like a
// train-station running sign or tickertape. Calm, single-line, one motion.
const FRAGMENTS = [
  'NOW FABRICATING · ALIEN·175',
  'QC PASS 98.2%',
  'KW·RED·07 APPROVED 認',
  'KILN DWELL 4.2s',
  'NEXT UP · SKATE DECK v04',
  'BROADCAST · 周波 107.3',
  'LOT 89S8·52·6EC64',
  'CH.01 — CH.08 LIVE',
  'ORBIT JP·ARCHIVE',
  'YIELD 96.4%',
];

export function NavStrip() {
  // rotate the index occasionally so the ● dot repositions and the
  // "NOW" fragment changes, without animating layout
  const [, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI((x) => x + 1), 2200);
    return () => clearInterval(id);
  }, []);

  const line = FRAGMENTS.join('  ◈  ');
  return (
    <div className="nav-mq" aria-hidden>
      <span className="nav-mq-led" />
      <span className="nav-mq-track">
        <span className="nav-mq-row">
          <span>{line}</span>
          <span>{line}</span>
        </span>
      </span>
    </div>
  );
}

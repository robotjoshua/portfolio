'use client';
import Link from 'next/link';
import { useState, type ReactNode } from 'react';
import type { Artifact } from '@/types/artifact';
import { Plate } from './Plate';

interface Section {
  k: string;
  subtitle?: string;
  body: ReactNode;
}

export function RecordAccordion({ sel, related }: { sel: Artifact; related: Artifact[] }) {
  const [open, setOpen] = useState<number>(0);

  const sections: Section[] = [
    {
      k: 'Identity',
      subtitle: `${sel.kind} · ${sel.catNo}`,
      body: (
        <div className="acc-kv">
          <div><span className="acc-k">Title</span><span className="acc-v">{sel.title}</span></div>
          <div><span className="acc-k">Cat. No.</span><span className="acc-v">{sel.catNo}</span></div>
          <div><span className="acc-k">Year</span><span className="acc-v">{sel.year}</span></div>
          <div><span className="acc-k">Production</span><span className="acc-v">{sel.production}</span></div>
          <div><span className="acc-k">Status</span><span className="acc-v">{sel.status}</span></div>
        </div>
      ),
    },
    {
      k: 'Specs',
      subtitle: sel.material,
      body: (
        <div className="acc-kv">
          <div><span className="acc-k">Material</span><span className="acc-v">{sel.material}</span></div>
          <div><span className="acc-k">Finish</span><span className="acc-v">{sel.finish}</span></div>
          <div><span className="acc-k">Dimensions</span><span className="acc-v">{sel.dims}</span></div>
        </div>
      ),
    },
    {
      k: 'Palette',
      subtitle: sel.palette.join(' · '),
      body: (
        <div className="acc-pal">
          {sel.palette.map((c, i) => (
            <div key={i} className="acc-pal-chip">
              <div className="acc-pal-sw" style={{ background: c }} />
              <div className="acc-pal-hex">{c.toUpperCase()}</div>
            </div>
          ))}
        </div>
      ),
    },
    ...(sel.note
      ? [
          {
            k: 'Build Note',
            subtitle: `${sel.note.length} chars`,
            body: <div className="acc-note">{sel.note}</div>,
          },
        ]
      : []),
    ...(related.length > 0
      ? [
          {
            k: 'Related',
            subtitle: `${related.length} linked`,
            body: (
              <div className="acc-rel">
                {related.map((a) => (
                  <Link key={a.id} href={`/archive/${a.id}`} className="acc-rel-c" title={`${a.id} · ${a.title}`}>
                    <Plate a={a} />
                    <div className="acc-rel-tag">{a.id}</div>
                  </Link>
                ))}
              </div>
            ),
          },
        ]
      : []),
  ];

  return (
    <div className="acc">
      {sections.map((s, i) => {
        const on = i === open;
        return (
          <div key={s.k} className={`acc-s${on ? ' on' : ''}`}>
            <button
              type="button"
              className="acc-h"
              onClick={() => setOpen(on ? -1 : i)}
              aria-expanded={on}
            >
              <span className="acc-hk">{s.k}</span>
              <span className="acc-hs">{s.subtitle}</span>
              <span className="acc-hx">{on ? '–' : '+'}</span>
            </button>
            {on && <div className="acc-b">{s.body}</div>}
          </div>
        );
      })}
    </div>
  );
}

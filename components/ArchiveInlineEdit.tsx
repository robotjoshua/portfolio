'use client';
import { useState, useRef, useCallback, type ReactNode } from 'react';
import Link from 'next/link';
import type { Artifact } from '@/types/artifact';
import { KINDS, STATUSES } from '@/types/artifact';
import { KS } from '@/lib/kinds';
import { Plate } from './Plate';

interface Props {
  initial: Artifact;
  related: Artifact[];
  readOnly?: boolean;
}

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

interface Section { k: string; subtitle: string; body: ReactNode }

function F({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <span className="acc-k">{label}</span>
      {children}
    </div>
  );
}

export function ArchiveInlineEdit({ initial, related, readOnly = false }: Props) {
  const [a, setA] = useState<Artifact>(initial);
  const [editing, setEditing] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [openSection, setOpenSection] = useState<number>(0);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const idRef = useRef<string>(initial.id);
  const aRef = useRef<Artifact>(initial);
  const inFlight = useRef<Promise<void> | null>(null);
  const isUnsorted = a.id.startsWith('U-');

  const queueSave = useCallback(() => {
    clearTimeout(timer.current);
    setSaveState('saving');
    timer.current = setTimeout(() => {
      const run = async () => {
        if (inFlight.current) {
          try { await inFlight.current; } catch {}
        }
        try {
          const draft = aRef.current;
          const currentId = idRef.current;
          const unsorted = currentId.startsWith('U-');
          if (unsorted) {
            const res = await fetch('/api/admin/artifacts', {
              method: 'POST',
              headers: { 'content-type': 'application/json' },
              body: JSON.stringify({ ...draft, id: undefined, index: undefined }),
            });
            if (!res.ok) throw new Error();
            const created = (await res.json()) as Artifact;
            idRef.current = created.id;
            aRef.current = { ...aRef.current, id: created.id, index: created.index };
            setA(cur => ({ ...cur, id: created.id, index: created.index }));
            window.history.replaceState(null, '', `/archive/${created.id}`);
          } else {
            const res = await fetch(`/api/admin/artifacts/${currentId}`, {
              method: 'PUT',
              headers: { 'content-type': 'application/json' },
              body: JSON.stringify({ ...draft, id: currentId }),
            });
            if (!res.ok) throw new Error();
          }
          setSaveState('saved');
          setTimeout(() => setSaveState('idle'), 1800);
        } catch {
          setSaveState('error');
        }
      };
      const p = run();
      inFlight.current = p;
      p.finally(() => { if (inFlight.current === p) inFlight.current = null; });
    }, 800);
  }, []);

  function set<K extends keyof Artifact>(field: K, value: Artifact[K]) {
    setA(cur => {
      const next = { ...cur, [field]: value };
      aRef.current = next;
      return next;
    });
    queueSave();
  }

  function setPal(i: 0 | 1 | 2, v: string) {
    const next: [string, string, string] = [...aRef.current.palette] as [string, string, string];
    next[i] = v;
    set('palette', next);
  }

  // ── read sections ─────────────────────────────────────────────────────────
  const readSections: Section[] = [
    {
      k: 'Identity', subtitle: `${a.kind} · ${a.catNo}`,
      body: (
        <div className="acc-kv">
          <div><span className="acc-k">Title</span><span className="acc-v">{a.title}</span></div>
          <div><span className="acc-k">Cat. No.</span><span className="acc-v">{a.catNo}</span></div>
          <div><span className="acc-k">Year</span><span className="acc-v">{a.year}</span></div>
          <div><span className="acc-k">Production</span><span className="acc-v">{a.production}</span></div>
          <div><span className="acc-k">Status</span><span className="acc-v">{a.status}</span></div>
        </div>
      ),
    },
    {
      k: 'Specs', subtitle: a.material,
      body: (
        <div className="acc-kv">
          <div><span className="acc-k">Material</span><span className="acc-v">{a.material}</span></div>
          <div><span className="acc-k">Finish</span><span className="acc-v">{a.finish}</span></div>
          <div><span className="acc-k">Dimensions</span><span className="acc-v">{a.dims}</span></div>
        </div>
      ),
    },
    {
      k: 'Palette', subtitle: a.palette.join(' · '),
      body: (
        <div className="acc-pal">
          {a.palette.map((c, i) => (
            <div key={i} className="acc-pal-chip">
              <div className="acc-pal-sw" style={{ background: c }} />
              <div className="acc-pal-hex">{c.toUpperCase()}</div>
            </div>
          ))}
        </div>
      ),
    },
    ...(a.note ? [{
      k: 'Build Note', subtitle: `${a.note.length} chars`,
      body: <div className="acc-note">{a.note}</div>,
    }] : []),
  ];

  // ── edit sections ─────────────────────────────────────────────────────────
  const editSections: Section[] = [
    {
      k: 'Identity', subtitle: `${a.kind} · ${a.catNo}`,
      body: (
        <div className="acc-kv">
          <F label="Title">
            <input className="aie-input acc-v" value={a.title} onChange={e => set('title', e.target.value)} />
          </F>
          <F label="Cat. No.">
            <input className="aie-input acc-v" value={a.catNo} onChange={e => set('catNo', e.target.value)} />
          </F>
          <F label="Year">
            <input className="aie-input acc-v" type="number" value={a.year} onChange={e => set('year', Number(e.target.value))} />
          </F>
          <F label="Production">
            <input className="aie-input acc-v" value={a.production} onChange={e => set('production', e.target.value)} />
          </F>
          <F label="Status">
            <select
              className="aie-input aie-select acc-v"
              value={a.status}
              onChange={e => set('status', e.target.value as Artifact['status'])}
            >
              {!STATUSES.includes(a.status) && <option value={a.status}>{a.status}</option>}
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </F>
        </div>
      ),
    },
    {
      k: 'Specs', subtitle: a.material,
      body: (
        <div className="acc-kv">
          <F label="Material">
            <input className="aie-input acc-v" value={a.material} onChange={e => set('material', e.target.value)} />
          </F>
          <F label="Finish">
            <input className="aie-input acc-v" value={a.finish} onChange={e => set('finish', e.target.value)} />
          </F>
          <F label="Dimensions">
            <input className="aie-input acc-v" value={a.dims} placeholder="H × W × D cm" onChange={e => set('dims', e.target.value)} />
          </F>
        </div>
      ),
    },
    {
      k: 'Palette', subtitle: a.palette.join(' · '),
      body: (
        <div className="acc-pal">
          {([0, 1, 2] as const).map((i) => (
            <div key={i} className="acc-pal-chip">
              <input
                type="color"
                className="aie-color"
                value={a.palette[i]}
                onChange={e => setPal(i, e.target.value)}
              />
              <input
                className="aie-hex"
                value={a.palette[i]}
                maxLength={7}
                onChange={e => { if (/^#[0-9a-fA-F]{0,6}$/.test(e.target.value)) setPal(i, e.target.value); }}
              />
            </div>
          ))}
        </div>
      ),
    },
    {
      k: 'Build Note', subtitle: `${(a.note ?? '').length} chars`,
      body: (
        <textarea
          className="aie-note"
          value={a.note ?? ''}
          rows={5}
          onChange={e => set('note', e.target.value)}
        />
      ),
    },
  ];

  const sections = editing ? editSections : readSections;

  // Related section (always read-only)
  const relatedSection: Section | null = related.length > 0 ? {
    k: 'Related', subtitle: `${related.length} linked`,
    body: (
      <div className="acc-rel">
        {related.map((r) => (
          <Link key={r.id} href={`/archive/${r.id}`} className="acc-rel-c" title={`${r.id} · ${r.title}`}>
            <Plate a={r} />
            <div className="acc-rel-tag">{r.id}</div>
          </Link>
        ))}
      </div>
    ),
  } : null;

  const allSections = relatedSection ? [...sections, relatedSection] : sections;

  return (
    <>
      {/* ── header ── */}
      <div className="arch-side-head">
        <div className="arch-sym">{KS[a.kind]}</div>
        {editing
          ? <>
              <input
                className="aie-kind arch-kind"
                list="aie-kind-options"
                value={a.kind}
                onChange={e => set('kind', e.target.value.toUpperCase() as Artifact['kind'])}
              />
              <datalist id="aie-kind-options">
                {KINDS.map(k => <option key={k} value={k} />)}
              </datalist>
            </>
          : <div className="arch-kind">{a.kind}</div>
        }
        {editing
          ? <input className="aie-title arch-title" value={a.title} onChange={e => set('title', e.target.value)} />
          : <div className="arch-title">{a.title}</div>
        }
        {editing
          ? <select
              className="aie-badge aie-select arch-badge"
              value={a.status}
              onChange={e => set('status', e.target.value as Artifact['status'])}
            >
              {!STATUSES.includes(a.status) && <option value={a.status}>{a.status}</option>}
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          : <div className="arch-badge">{a.status}</div>
        }

        {/* edit toggle + save indicator */}
        {!readOnly && (
          <div className="aie-toolbar">
            <button
              type="button"
              className={`aie-toggle${editing ? ' on' : ''}`}
              onClick={() => setEditing(e => !e)}
            >
              {editing ? 'DONE' : 'EDIT'}
            </button>
            {saveState === 'saving' && <span className="aie-save-state">saving…</span>}
            {saveState === 'saved'  && <span className="aie-save-state ok">saved ✓</span>}
            {saveState === 'error'  && <span className="aie-save-state err">error</span>}
          </div>
        )}
      </div>

      {/* ── accordion ── */}
      <div className="acc">
        {allSections.map((s, i) => {
          const on = i === openSection;
          return (
            <div key={s.k} className={`acc-s${on ? ' on' : ''}`}>
              <button type="button" className="acc-h" onClick={() => setOpenSection(on ? -1 : i)} aria-expanded={on}>
                <span className="acc-hk">{s.k}</span>
                <span className="acc-hs">{s.subtitle}</span>
                <span className="acc-hx">{on ? '–' : '+'}</span>
              </button>
              {on && <div className="acc-b">{s.body}</div>}
            </div>
          );
        })}
      </div>
    </>
  );
}

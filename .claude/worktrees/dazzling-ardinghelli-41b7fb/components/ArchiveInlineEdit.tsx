'use client';
import { useState, useRef, useCallback, type ReactNode } from 'react';
import Link from 'next/link';
import type { Artifact, ArtifactImage } from '@/types/artifact';
import { KINDS, STATUSES } from '@/types/artifact';
import { KS } from '@/lib/kinds';
import { generateName } from '@/lib/namegen';
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
  const [deleting, setDeleting] = useState(false);
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

  async function uploadAndAttach(files: FileList | File[]) {
    const list = Array.from(files);
    for (const file of list) {
      setSaveState('saving');
      try {
        const fd = new FormData();
        fd.append('file', file);
        const res = await fetch('/api/admin/uploads', { method: 'POST', body: fd });
        if (!res.ok) throw new Error();
        const { file: up } = (await res.json()) as { file: { src: string; thumb: string; w?: number; h?: number; originalName: string } };
        const img: ArtifactImage = { src: up.src, thumb: up.thumb, w: up.w, h: up.h, alt: up.originalName };
        set('images', [...(aRef.current.images ?? []), img]);
      } catch {
        setSaveState('error');
      }
    }
  }

  async function deleteArtifact() {
    const currentId = idRef.current;
    const current = aRef.current;
    const label = current.title || currentId;
    if (!confirm(`Delete "${label}"? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      let res: Response;
      if (currentId.startsWith('U-')) {
        // Unclaimed upload — delete the underlying upload row + blobs.
        const src = current.images?.[0]?.src ?? '';
        const match = src.match(/([^/]+\.webp)$/i);
        if (!match) throw new Error('no filename');
        res = await fetch(`/api/admin/uploads/${match[1]}`, { method: 'DELETE' });
      } else {
        res = await fetch(`/api/admin/artifacts/${currentId}`, { method: 'DELETE' });
      }
      if (!res.ok) throw new Error();
      window.location.href = '/catalog';
    } catch {
      setDeleting(false);
      setSaveState('error');
    }
  }

  async function removeImage(src: string) {
    const currentId = idRef.current;
    // U-* items are synthesized from uploads.json; removal = delete upload entry + file
    if (currentId.startsWith('U-')) {
      const match = src.match(/^\/uploads\/([^/?#]+)$/);
      if (match) {
        try {
          await fetch(`/api/admin/uploads/${match[1]}`, { method: 'DELETE' });
          // The U-* no longer has a source, so navigate away
          window.location.href = '/catalog';
        } catch { /* noop */ }
      }
      return;
    }
    // JP-* path: optimistic local removal, then server-side cleanup
    const nextImages = (aRef.current.images ?? []).filter((i) => i.src !== src);
    setA(cur => {
      const next = { ...cur, images: nextImages };
      aRef.current = next;
      return next;
    });
    try {
      await fetch(`/api/admin/artifacts/${currentId}/images`, {
        method: 'DELETE',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ src }),
      });
      setSaveState('saved');
      setTimeout(() => setSaveState('idle'), 1500);
    } catch {
      setSaveState('error');
    }
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
    {
      k: 'Images', subtitle: `${(a.images ?? []).length} attached`,
      body: (
        <div className="adm-img-grid">
          {(a.images ?? []).map((img) => (
            <div key={img.src} className="adm-img">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.thumb || img.src} alt={img.alt || ''} />
            </div>
          ))}
          {(a.images ?? []).length === 0 && <div className="aie-img-empty">No images</div>}
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
            <div className="aie-input-row">
              <input className="aie-input acc-v" value={a.title} onChange={e => set('title', e.target.value)} />
              <button
                type="button"
                className="aie-gen"
                title="Generate random name"
                onClick={() => set('title', generateName())}
              >
                ⟳
              </button>
            </div>
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
          <F label="Show on index">
            <label className="aie-check">
              <input
                type="checkbox"
                checked={a.showOnIndex !== false}
                onChange={e => set('showOnIndex', e.target.checked)}
              />
              <span className="aie-check-hint">
                {a.showOnIndex === false ? 'Hidden from home mosaic' : 'Visible on home'}
              </span>
            </label>
          </F>
          {!readOnly && (
            <F label="Danger zone">
              <button
                type="button"
                className="aie-delete"
                onClick={deleteArtifact}
                disabled={deleting}
                title="Delete this artifact"
              >
                {deleting ? 'DELETING…' : '× DELETE ARTIFACT'}
              </button>
            </F>
          )}
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
      k: 'Images', subtitle: `${(a.images ?? []).length} attached`,
      body: (
        <div className="aie-img-section">
          {isUnsorted && (
            <div className="aie-img-note">
              This item will be created when you add/remove an image or edit any other field.
            </div>
          )}
          <div className="adm-img-grid">
            {(a.images ?? []).map((img) => (
              <div key={img.src} className="adm-img">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.thumb || img.src} alt={img.alt || ''} />
                <button
                  type="button"
                  className="rm"
                  onClick={() => {
                    if (confirm('Remove this image?')) removeImage(img.src);
                  }}
                >
                  × REMOVE
                </button>
              </div>
            ))}
            <label className="adm-img aie-img-add" title="Add image">
              <input
                type="file"
                accept="image/*"
                multiple
                style={{ display: 'none' }}
                onChange={(e) => {
                  const files = e.target.files;
                  if (files && files.length) uploadAndAttach(files);
                  e.target.value = '';
                }}
              />
              <span>+ ADD</span>
            </label>
          </div>
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
          ? <div className="aie-title-row">
              <input className="aie-title arch-title" value={a.title} onChange={e => set('title', e.target.value)} />
              <button
                type="button"
                className="aie-gen aie-gen-lg"
                title="Generate random name"
                onClick={() => set('title', generateName())}
              >
                ⟳
              </button>
            </div>
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

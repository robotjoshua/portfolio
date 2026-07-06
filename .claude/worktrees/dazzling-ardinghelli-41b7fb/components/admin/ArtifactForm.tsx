'use client';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import type { Artifact, ArtifactImage } from '@/types/artifact';
import { KINDS, STATUSES } from '@/types/artifact';
import { ImageUploader } from './ImageUploader';

type Draft = Partial<Artifact>;

export function ArtifactForm({ initial, mode }: { initial?: Artifact; mode: 'create' | 'edit' }) {
  const router = useRouter();
  const [d, setD] = useState<Draft>(
    initial ?? {
      title: '',
      year: new Date().getFullYear(),
      kind: 'TECH',
      production: '',
      material: '',
      finish: '',
      status: 'ARCHIVE',
      dims: '',
      palette: ['#1a1a18', '#7a7868', '#dcdad0'],
      note: '',
      images: [],
    },
  );
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const set = <K extends keyof Artifact>(k: K, v: Artifact[K]) => setD((p) => ({ ...p, [k]: v }));
  const setPal = (i: 0 | 1 | 2, v: string) =>
    setD((p) => {
      const cur = (p.palette ?? ['#000', '#000', '#000']) as [string, string, string];
      const next = [...cur] as [string, string, string];
      next[i] = v;
      return { ...p, palette: next };
    });

  async function onImagesChanged(images: ArtifactImage[]) {
    setD((p) => ({ ...p, images }));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    const url =
      mode === 'create'
        ? '/api/admin/artifacts'
        : `/api/admin/artifacts/${initial!.id}`;
    const method = mode === 'create' ? 'POST' : 'PUT';
    const res = await fetch(url, {
      method,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(d),
    });
    setBusy(false);
    if (!res.ok) {
      setErr(`${res.status} ${await res.text()}`);
      return;
    }
    const saved = (await res.json()) as Artifact;
    router.push(`/admin/${saved.id}/edit`);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit}>
      <div className="adm-form">
        <label>Title</label>
        <input type="text" value={d.title ?? ''} onChange={(e) => set('title', e.target.value)} required />

        <label>Year</label>
        <input
          type="number"
          value={d.year ?? ''}
          onChange={(e) => set('year', Number(e.target.value))}
          required
        />

        <label>Kind</label>
        <input
          type="text"
          list="kind-options"
          value={d.kind ?? ''}
          onChange={(e) => set('kind', e.target.value.toUpperCase())}
          placeholder="WEAPON · ARMOR · or type a new kind"
        />
        <datalist id="kind-options">
          {KINDS.map((k) => (
            <option key={k} value={k} />
          ))}
        </datalist>

        <label>Status</label>
        <input
          type="text"
          list="status-options"
          value={d.status ?? ''}
          onChange={(e) => set('status', e.target.value.toUpperCase())}
          placeholder="HERO · STUNT · DISPLAY · ARCHIVE · or custom"
        />
        <datalist id="status-options">
          {STATUSES.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>

        <label>Production</label>
        <input type="text" value={d.production ?? ''} onChange={(e) => set('production', e.target.value)} />

        <label>Cat. No.</label>
        <input type="text" value={d.catNo ?? ''} onChange={(e) => set('catNo', e.target.value)} placeholder="auto if empty" />

        <label>Material</label>
        <input type="text" value={d.material ?? ''} onChange={(e) => set('material', e.target.value)} />

        <label>Finish</label>
        <input type="text" value={d.finish ?? ''} onChange={(e) => set('finish', e.target.value)} />

        <label>Dimensions</label>
        <input type="text" value={d.dims ?? ''} onChange={(e) => set('dims', e.target.value)} placeholder="H × W × D cm" />

        <label>Palette (3 hex)</label>
        <div className="adm-pal-row">
          {[0, 1, 2].map((i) => (
            <div key={i} style={{ flex: 1, display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                type="color"
                value={(d.palette?.[i] as string) ?? '#000000'}
                onChange={(e) => setPal(i as 0 | 1 | 2, e.target.value)}
                style={{ width: 36, height: 36, padding: 0, border: '1px solid var(--rule-2)' }}
              />
              <input
                type="text"
                value={(d.palette?.[i] as string) ?? ''}
                onChange={(e) => setPal(i as 0 | 1 | 2, e.target.value)}
              />
            </div>
          ))}
        </div>

        <label>Build Note</label>
        <textarea value={d.note ?? ''} onChange={(e) => set('note', e.target.value)} />
      </div>

      {mode === 'edit' && initial && (
        <div style={{ marginBottom: 28 }}>
          <div
            style={{
              fontFamily: 'var(--f-m)',
              fontSize: 10,
              letterSpacing: '.14em',
              textTransform: 'uppercase',
              color: 'var(--muted)',
              marginBottom: 12,
            }}
          >
            Images — drag &amp; drop or click to upload
          </div>
          <ImageUploader id={initial.id} images={d.images ?? []} onChange={onImagesChanged} />
        </div>
      )}

      {err && (
        <div
          style={{
            padding: 12,
            background: '#b14a36',
            color: 'white',
            marginBottom: 14,
            fontFamily: 'var(--f-m)',
            fontSize: 11,
            borderRadius: 6,
          }}
        >
          {err}
        </div>
      )}

      <div className="adm-actions">
        <button type="submit" className="adm-btn" disabled={busy}>
          {busy ? 'Saving…' : mode === 'create' ? 'Create' : 'Save'}
        </button>
        <button type="button" className="adm-btn ghost" onClick={() => router.push('/admin')}>
          Cancel
        </button>
      </div>
    </form>
  );
}

'use client';
import { useState, useEffect, type DragEvent, type ChangeEvent } from 'react';
import type { ArtifactImage } from '@/types/artifact';

interface Props {
  id: string;
  images: ArtifactImage[];
  onChange: (images: ArtifactImage[]) => void;
}

export function ImageUploader({ id, images, onChange }: Props) {
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [drafts, setDrafts] = useState<ArtifactImage[]>(images);

  // keep drafts in sync when parent prop changes (e.g. after upload or remove)
  useEffect(() => {
    setDrafts(images);
  }, [images]);

  const dirty = JSON.stringify(drafts) !== JSON.stringify(images);

  async function putImages(next: ArtifactImage[]): Promise<boolean> {
    setBusy(true);
    setErr(null);
    const res = await fetch(`/api/admin/artifacts/${id}`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ images: next }),
    });
    setBusy(false);
    if (!res.ok) {
      setErr(`${res.status} ${await res.text()}`);
      return false;
    }
    return true;
  }

  async function upload(files: FileList | File[]) {
    const list = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (list.length === 0) return;
    setBusy(true);
    setErr(null);
    const fd = new FormData();
    fd.append('id', id);
    for (const f of list) fd.append('files', f);
    const res = await fetch('/api/admin/upload', { method: 'POST', body: fd });
    setBusy(false);
    if (!res.ok) {
      setErr(`${res.status} ${await res.text()}`);
      return;
    }
    const data = (await res.json()) as { images: ArtifactImage[] };
    onChange(data.images);
  }

  async function remove(index: number) {
    if (!confirm('Remove this image? (file stays on disk until next save cycle)')) return;
    const next = drafts.filter((_, i) => i !== index);
    if (await putImages(next)) onChange(next);
  }

  async function saveMeta() {
    if (await putImages(drafts)) {
      onChange(drafts);
      setOk(true);
      setTimeout(() => setOk(false), 1500);
    }
  }

  function move(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= drafts.length) return;
    const next = drafts.slice();
    [next[index], next[target]] = [next[target], next[index]];
    setDrafts(next);
  }

  function updateField(i: number, field: 'alt' | 'caption', value: string) {
    setDrafts((prev) => prev.map((img, idx) => (idx === i ? { ...img, [field]: value } : img)));
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDrag(false);
    if (e.dataTransfer.files.length) void upload(e.dataTransfer.files);
  }

  function onPick(e: ChangeEvent<HTMLInputElement>) {
    if (e.target.files?.length) void upload(e.target.files);
    e.target.value = '';
  }

  return (
    <div>
      <label
        className={`adm-drop${drag ? ' drag' : ''}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={onDrop}
      >
        {busy ? 'Uploading…' : 'Drop images here or click to browse'}
        <input
          type="file"
          accept="image/*"
          multiple
          style={{ display: 'none' }}
          onChange={onPick}
        />
      </label>

      {err && (
        <div
          style={{
            padding: 10,
            background: '#b14a36',
            color: 'white',
            marginTop: 10,
            fontFamily: 'var(--f-m)',
            fontSize: 11,
          }}
        >
          {err}
        </div>
      )}

      {drafts.length > 0 && (
        <>
          <div className="img-meta-list">
            {drafts.map((img, i) => (
              <div key={img.src} className="img-meta-row">
                <div className="img-meta-thumb">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.thumb ?? img.src} alt={img.alt || `image ${i + 1}`} />
                  <div className="img-meta-idx">{String(i + 1).padStart(2, '0')}</div>
                </div>
                <div className="img-meta-fields">
                  <label>Alt text</label>
                  <input
                    type="text"
                    value={img.alt ?? ''}
                    onChange={(e) => updateField(i, 'alt', e.target.value)}
                    placeholder="Describe this image"
                  />
                  <label>Caption</label>
                  <input
                    type="text"
                    value={img.caption ?? ''}
                    onChange={(e) => updateField(i, 'caption', e.target.value)}
                    placeholder="Optional caption"
                  />
                </div>
                <div className="img-meta-ctrls">
                  <button
                    type="button"
                    className="adm-btn ghost"
                    onClick={() => move(i, -1)}
                    disabled={i === 0 || busy}
                    title="Move up"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className="adm-btn ghost"
                    onClick={() => move(i, 1)}
                    disabled={i === drafts.length - 1 || busy}
                    title="Move down"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    className="adm-btn ghost danger-hover"
                    onClick={() => remove(i)}
                    disabled={busy}
                    title="Remove"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
            <button
              type="button"
              className="adm-btn"
              onClick={saveMeta}
              disabled={busy || !dirty}
            >
              {busy ? 'Saving…' : ok ? 'Saved ✓' : 'Save image info'}
            </button>
            {dirty && (
              <button
                type="button"
                className="adm-btn ghost"
                onClick={() => setDrafts(images)}
                disabled={busy}
              >
                Revert
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

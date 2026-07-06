'use client';
import { useReducer, useMemo, useEffect, useState, type DragEvent, type ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import type { UploadedFile } from '@/types/upload';
import type { CatalogResult } from '@/app/api/admin/catalog/route';
import type { Artifact } from '@/types/artifact';

type Status = 'queued' | 'uploading' | 'done' | 'error';
type CatalogStatus = 'idle' | 'loading' | 'done' | 'error';

interface BatchItem {
  id: string;
  file: File;
  preview: string;
  status: Status;
  progress: number;
  selected: boolean;
  error?: string;
  result?: UploadedFile;
  context: string;
  catalogStatus: CatalogStatus;
  catalog?: CatalogResult;
  catalogError?: string;
  attachedTo?: string;
}

type Action =
  | { type: 'add'; items: BatchItem[] }
  | { type: 'remove'; id: string }
  | { type: 'removeSelected' }
  | { type: 'patch'; id: string; patch: Partial<BatchItem> }
  | { type: 'toggleSelect'; id: string }
  | { type: 'selectAll' }
  | { type: 'deselectAll' }
  | { type: 'dragOn' }
  | { type: 'dragOff' }
  | { type: 'clearDone' };

interface State { items: BatchItem[]; dragOver: boolean }

const ACCEPTED = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
  'image/tiff',
  'image/bmp',
  'image/heic',
  'image/heif',
  'image/svg+xml',
  'image/x-icon',
]);
const MAX_MB = 25;
function isImageFile(f: File): boolean {
  if (ACCEPTED.has(f.type)) return true;
  return f.type.startsWith('image/') || /\.(jpe?g|png|webp|gif|avif|tiff?|bmp|heic|heif|svg|ico)$/i.test(f.name);
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'add':
      return { ...state, items: [...state.items, ...action.items] };
    case 'remove': {
      const gone = state.items.find((i) => i.id === action.id);
      if (gone) URL.revokeObjectURL(gone.preview);
      return { ...state, items: state.items.filter((i) => i.id !== action.id) };
    }
    case 'removeSelected': {
      const keep = state.items.filter((i) => !i.selected);
      state.items.filter((i) => i.selected).forEach((i) => URL.revokeObjectURL(i.preview));
      return { ...state, items: keep };
    }
    case 'patch':
      return { ...state, items: state.items.map((i) => i.id === action.id ? { ...i, ...action.patch } : i) };
    case 'toggleSelect':
      return { ...state, items: state.items.map((i) => i.id === action.id ? { ...i, selected: !i.selected } : i) };
    case 'selectAll':
      return { ...state, items: state.items.map((i) => ({ ...i, selected: true })) };
    case 'deselectAll':
      return { ...state, items: state.items.map((i) => ({ ...i, selected: false })) };
    case 'dragOn':
      return { ...state, dragOver: true };
    case 'dragOff':
      return { ...state, dragOver: false };
    case 'clearDone': {
      state.items.filter((i) => i.status === 'done').forEach((i) => URL.revokeObjectURL(i.preview));
      return { ...state, items: state.items.filter((i) => i.status !== 'done') };
    }
  }
}

function fmtBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

function uploadOne(item: BatchItem, onProgress: (pct: number) => void): Promise<UploadedFile> {
  return new Promise((resolve, reject) => {
    const fd = new FormData();
    fd.append('file', item.file);
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/admin/uploads');
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try { resolve((JSON.parse(xhr.responseText) as { file: UploadedFile }).file); }
        catch { reject(new Error('bad response')); }
      } else {
        let msg = `${xhr.status}`;
        try { msg = (JSON.parse(xhr.responseText) as { error?: string }).error ?? msg; } catch {}
        reject(new Error(msg));
      }
    };
    xhr.onerror = () => reject(new Error('network error'));
    xhr.send(fd);
  });
}

const STATUS_LABEL: Record<Status, string> = {
  queued: 'queued',
  uploading: 'uploading',
  done: 'saved',
  error: 'error',
};

export function ImageBatchLoader() {
  const router = useRouter();
  const [state, dispatch] = useReducer(reducer, { items: [], dragOver: false });
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);

  useEffect(() => {
    fetch('/api/admin/artifacts')
      .then((r) => r.json())
      .then((d: Artifact[]) => setArtifacts(d))
      .catch(() => {});
  }, []);

  const summary = useMemo(() => {
    const total = state.items.length;
    const size = state.items.reduce((s, i) => s + i.file.size, 0);
    const done = state.items.filter((i) => i.status === 'done').length;
    const errors = state.items.filter((i) => i.status === 'error').length;
    const selected = state.items.filter((i) => i.selected).length;
    return { total, size, done, errors, selected };
  }, [state.items]);

  const anyUploading = state.items.some((i) => i.status === 'uploading');
  const readyToSend = state.items.some((i) => i.status === 'queued' || i.status === 'error');
  const allSelected = summary.selected === summary.total && summary.total > 0;

  function addFiles(files: FileList | File[]) {
    const next: BatchItem[] = [];
    for (const file of Array.from(files)) {
      if (!isImageFile(file) || file.size > MAX_MB * 1024 * 1024) continue;
      next.push({
        id: `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2, 7)}`,
        file,
        preview: URL.createObjectURL(file),
        status: 'queued',
        progress: 0,
        selected: false,
        catalogStatus: 'idle',
        context: '',
      });
    }
    if (next.length) dispatch({ type: 'add', items: next });
  }

  async function sendAll() {
    const queue = state.items.filter((i) => i.status === 'queued' || i.status === 'error');
    let anySuccess = false;
    for (const item of queue) {
      dispatch({ type: 'patch', id: item.id, patch: { status: 'uploading', progress: 0, error: undefined } });
      try {
        const result = await uploadOne(item, (pct) =>
          dispatch({ type: 'patch', id: item.id, patch: { progress: pct } }),
        );
        dispatch({ type: 'patch', id: item.id, patch: { status: 'done', progress: 100, result } });
        anySuccess = true;
      } catch (e) {
        dispatch({ type: 'patch', id: item.id, patch: { status: 'error', error: (e as Error).message } });
      }
    }
    if (anySuccess) router.refresh();
  }

  async function catalogItem(item: BatchItem, mode: 'auto' | 'fiction' = 'auto') {
    if (!item.result) return;
    dispatch({ type: 'patch', id: item.id, patch: { catalogStatus: 'loading' } });
    try {
      const res = await fetch('/api/admin/catalog', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ src: item.result.src, context: item.context, mode }),
      });
      const data = await res.json() as CatalogResult & { error?: string };
      if (!res.ok) throw new Error(data.error ?? String(res.status));
      dispatch({ type: 'patch', id: item.id, patch: { catalogStatus: 'done', catalog: data } });
    } catch (e) {
      dispatch({ type: 'patch', id: item.id, patch: { catalogStatus: 'error', catalogError: (e as Error).message } });
    }
  }

  async function attachToArtifact(item: BatchItem, artifactId: string) {
    if (!item.result) return;
    const artifact = artifacts.find((a) => a.id === artifactId);
    if (!artifact) return;
    const updated = {
      images: [
        ...(artifact.images ?? []),
        { src: item.result.src, thumb: item.result.thumb, w: item.result.w, h: item.result.h, alt: item.catalog?.alt || '' },
      ],
    };
    const res = await fetch(`/api/admin/artifacts/${artifactId}`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(updated),
    });
    if (res.ok) {
      setArtifacts((prev) => prev.map((a) => a.id === artifactId ? { ...a, ...updated } : a));
      dispatch({ type: 'patch', id: item.id, patch: { attachedTo: artifactId } });
      router.refresh();
    }
  }

  async function createArtifact(item: BatchItem) {
    if (!item.catalog || !item.result) return;
    const res = await fetch('/api/admin/artifacts', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        title: item.catalog.title,
        year: item.catalog.year,
        kind: item.catalog.kind,
        material: item.catalog.material,
        note: item.catalog.note,
        status: 'ARCHIVE',
        palette: item.catalog.palette,
        images: [{ src: item.result.src, thumb: item.result.thumb, w: item.result.w, h: item.result.h, alt: item.catalog.alt }],
      }),
    });
    if (!res.ok) return;
    router.push(`/admin/${(await res.json() as { id: string }).id}/edit`);
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    dispatch({ type: 'dragOff' });
    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
  }

  function onPick(e: ChangeEvent<HTMLInputElement>) {
    if (e.target.files?.length) addFiles(e.target.files);
    e.target.value = '';
  }

  return (
    <div className="bl-wrap">
      <label
        className={`bl-drop${state.dragOver ? ' drag' : ''}`}
        onDragOver={(e) => { e.preventDefault(); if (!state.dragOver) dispatch({ type: 'dragOn' }); }}
        onDragLeave={() => dispatch({ type: 'dragOff' })}
        onDrop={onDrop}
      >
        <div className="bl-drop-icon">▤</div>
        <div className="bl-drop-label">{state.dragOver ? 'Release to add' : 'Drop images or click to browse'}</div>
        <div className="bl-drop-sub">JPG · PNG · WebP · GIF · max {MAX_MB} MB</div>
        <input type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={onPick} />
      </label>

      {state.items.length > 0 && (
        <div className="bl-summary">
          <div className="bl-summary-cells">
            <div><span className="bl-sk">Files</span><span className="bl-sv">{summary.total}</span></div>
            <div><span className="bl-sk">Size</span><span className="bl-sv">{fmtBytes(summary.size)}</span></div>
            <div><span className="bl-sk">Done</span><span className="bl-sv">{summary.done}</span></div>
            {summary.errors > 0 && <div><span className="bl-sk">Errors</span><span className="bl-sv bl-err">{summary.errors}</span></div>}
          </div>
          <div className="bl-summary-ctrls">
            <button type="button" className="adm-btn ghost" onClick={() => allSelected ? dispatch({ type: 'deselectAll' }) : dispatch({ type: 'selectAll' })}>
              {allSelected ? 'Deselect all' : 'Select all'}
            </button>
            {summary.selected > 0 && (
              <button type="button" className="adm-btn ghost bl-del-btn" onClick={() => dispatch({ type: 'removeSelected' })}>
                Delete {summary.selected}
              </button>
            )}
            {summary.done > 0 && summary.selected === 0 && (
              <button type="button" className="adm-btn ghost" onClick={() => dispatch({ type: 'clearDone' })} disabled={anyUploading}>
                Clear done
              </button>
            )}
            {summary.done > 0 && (
              <button
                type="button"
                className="adm-btn ghost"
                onClick={() => {
                  const targets = state.items.filter((i) => (summary.selected > 0 ? i.selected : true) && i.status === 'done' && i.catalogStatus !== 'loading');
                  targets.forEach((t) => { void catalogItem(t, 'fiction'); });
                }}
                disabled={anyUploading}
                title="Generate fictional categorical data for every uploaded image"
              >
                ⚑ Fiction all
              </button>
            )}
            <button type="button" className="adm-btn" onClick={sendAll} disabled={anyUploading || !readyToSend}>
              {anyUploading ? 'Uploading…' : `Upload ${readyToSend ? state.items.filter(i => i.status === 'queued' || i.status === 'error').length : 0}`}
            </button>
          </div>
        </div>
      )}

      {state.items.length > 0 && (
        <div className="bl-grid">
          {state.items.map((item) => (
            <div
              key={item.id}
              className={`bl-card bl-${item.status}${item.selected ? ' bl-selected' : ''}`}
              onClick={() => dispatch({ type: 'toggleSelect', id: item.id })}
            >
              {/* ── thumb ── */}
              <div className="bl-thumb">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.preview} alt={item.file.name} />

                <div className={`bl-check${item.selected ? ' on' : ''}`}>
                  {item.selected ? '✓' : ''}
                </div>

                {item.status === 'uploading' && (
                  <div className="bl-progress">
                    <div className="bl-progress-bar" style={{ width: `${item.progress}%` }} />
                    <span>{item.progress}%</span>
                  </div>
                )}

                {item.status !== 'uploading' && (
                  <button
                    type="button"
                    className="bl-remove"
                    onClick={(e) => { e.stopPropagation(); dispatch({ type: 'remove', id: item.id }); }}
                    aria-label={`Remove ${item.file.name}`}
                  >
                    ×
                  </button>
                )}

                <div className={`bl-status-bar bl-status-bar-${item.status}`}>
                  {item.status === 'error' ? (item.error ?? 'error') : STATUS_LABEL[item.status]}
                  {item.attachedTo && <span className="bl-attached-id"> → {item.attachedTo}</span>}
                </div>
              </div>

              {/* ── meta ── */}
              <div className="bl-meta" onClick={(e) => e.stopPropagation()}>
                <div className="bl-name" title={item.file.name}>{item.file.name}</div>
                <div className="bl-sub">
                  <span>{fmtBytes(item.file.size)}</span>
                  {item.result && <span>{item.result.w}×{item.result.h}</span>}
                </div>
              </div>

              {/* ── attach ── */}
              {item.status === 'done' && artifacts.length > 0 && (
                <select
                  className="bl-attach-select"
                  defaultValue=""
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => { if (e.target.value) attachToArtifact(item, e.target.value); e.target.value = ''; }}
                >
                  <option value="" disabled>attach to artifact…</option>
                  {artifacts.map((a) => (
                    <option key={a.id} value={a.id}>{a.id} · {a.title}</option>
                  ))}
                </select>
              )}

              {/* ── context ── */}
              {item.status === 'done' && (
                <input
                  type="text"
                  className="bl-context"
                  placeholder="production · notes · context"
                  value={item.context}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => dispatch({ type: 'patch', id: item.id, patch: { context: e.target.value } })}
                  disabled={item.catalogStatus === 'loading'}
                />
              )}

              {/* ── catalog ── */}
              {item.status === 'done' && (
                <div className="bl-catalog" onClick={(e) => e.stopPropagation()}>
                  {item.catalogStatus === 'idle' && (
                    <div className="bl-catalog-btns">
                      <button type="button" className="bl-catalog-btn" onClick={() => catalogItem(item, 'auto')}>
                        ⟳ Analyze
                      </button>
                      <button type="button" className="bl-catalog-btn ghost" onClick={() => catalogItem(item, 'fiction')} title="Generate fictional categorical data">
                        ⚑ Fiction
                      </button>
                    </div>
                  )}
                  {item.catalogStatus === 'loading' && <div className="bl-catalog-loading">analyzing…</div>}
                  {item.catalogStatus === 'error' && (
                    <div className="bl-catalog-err">
                      {item.catalogError}
                      <button type="button" className="bl-catalog-btn" onClick={() => catalogItem(item)} style={{ marginLeft: 6 }}>retry</button>
                    </div>
                  )}
                  {item.catalogStatus === 'done' && item.catalog && (
                    <div className="bl-catalog-result">
                      <div className="bl-catalog-title">
                        {item.catalog.needsReview && <span className="bl-catalog-flag">⚑</span>}
                        {item.catalog.title}
                      </div>
                      <div className="bl-catalog-row">
                        <span className="bl-catalog-kind">{item.catalog.kind}</span>
                        {item.catalog.year !== new Date().getFullYear() && <span className="bl-catalog-year">{item.catalog.year}</span>}
                        <span className={`bl-catalog-src bl-catalog-src-${item.catalog.source}`}>{item.catalog.source}</span>
                      </div>
                      <div className="bl-catalog-pal">
                        {item.catalog.palette.map((hex, i) => (
                          <span key={`${i}-${hex}`} className="bl-catalog-swatch" style={{ background: hex }} title={hex} />
                        ))}
                      </div>
                      {item.catalog.material && <div className="bl-catalog-mat">{item.catalog.material}</div>}
                      <button type="button" className="bl-catalog-create" onClick={() => createArtifact(item)}>
                        + Create artifact
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

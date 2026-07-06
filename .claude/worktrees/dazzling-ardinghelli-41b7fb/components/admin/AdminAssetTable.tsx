'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import type { Artifact } from '@/types/artifact';
import type { UploadedFile } from '@/types/upload';
import { KS } from '@/lib/kinds';
import { generateName } from '@/lib/namegen';

// A unified admin asset row. Either a real artifact, or an unclaimed upload
// (`u:<filename>`). Both share the same table so admins see a single backlog.
interface ArtifactRow {
  rowKind: 'artifact';
  key: string;
  id: string;
  artifact: Artifact;
}
interface UploadRow {
  rowKind: 'upload';
  key: string;
  id: string; // synthetic "U-<filename>"
  upload: UploadedFile;
}
type Row = ArtifactRow | UploadRow;

type FilterKind = 'all' | 'artifacts' | 'unclaimed' | 'no-images';

interface Props {
  artifacts: Artifact[];
  uploads: UploadedFile[];
}

function buildRows(artifacts: Artifact[], uploads: UploadedFile[]): Row[] {
  const out: Row[] = [];
  for (const a of artifacts) {
    out.push({ rowKind: 'artifact', key: `a:${a.id}`, id: a.id, artifact: a });
  }
  for (const u of uploads) {
    out.push({ rowKind: 'upload', key: `u:${u.filename}`, id: `U-${u.filename}`, upload: u });
  }
  return out;
}

function matchFilter(row: Row, f: FilterKind, q: string): boolean {
  if (f === 'artifacts' && row.rowKind !== 'artifact') return false;
  if (f === 'unclaimed' && row.rowKind !== 'upload') return false;
  if (f === 'no-images' && (row.rowKind !== 'artifact' || (row.artifact.images?.length ?? 0) > 0)) return false;

  if (!q) return true;
  const needle = q.toLowerCase();
  if (row.rowKind === 'artifact') {
    const a = row.artifact;
    return (
      a.id.toLowerCase().includes(needle) ||
      a.title.toLowerCase().includes(needle) ||
      (a.production || '').toLowerCase().includes(needle) ||
      (a.kind || '').toLowerCase().includes(needle)
    );
  }
  const u = row.upload;
  return u.filename.toLowerCase().includes(needle) || u.originalName.toLowerCase().includes(needle);
}

function thumbFor(row: Row): string | null {
  if (row.rowKind === 'artifact') return row.artifact.images?.[0]?.thumb ?? row.artifact.images?.[0]?.src ?? null;
  return row.upload.thumb;
}

export function AdminAssetTable({ artifacts, uploads }: Props) {
  const router = useRouter();
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [filter, setFilter] = useState<FilterKind>('all');
  const [q, setQ] = useState('');

  const rows = useMemo(() => buildRows(artifacts, uploads), [artifacts, uploads]);
  const visible = useMemo(() => rows.filter((r) => matchFilter(r, filter, q)), [rows, filter, q]);

  const counts = useMemo(() => ({
    all: rows.length,
    artifacts: rows.filter((r) => r.rowKind === 'artifact').length,
    unclaimed: rows.filter((r) => r.rowKind === 'upload').length,
    noImages: rows.filter((r) => r.rowKind === 'artifact' && (r.artifact.images?.length ?? 0) === 0).length,
  }), [rows]);

  const selRows = useMemo(() => visible.filter((r) => sel.has(r.key)), [visible, sel]);
  const selArtifacts = selRows.filter((r): r is ArtifactRow => r.rowKind === 'artifact');
  const selUploads = selRows.filter((r): r is UploadRow => r.rowKind === 'upload');

  const allChecked = visible.length > 0 && visible.every((r) => sel.has(r.key));
  const someChecked = sel.size > 0 && !allChecked;

  function toggle(key: string) {
    setSel((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }
  function toggleAll() {
    if (allChecked) {
      setSel((prev) => {
        const next = new Set(prev);
        for (const r of visible) next.delete(r.key);
        return next;
      });
    } else {
      setSel((prev) => {
        const next = new Set(prev);
        for (const r of visible) next.add(r.key);
        return next;
      });
    }
  }

  async function deleteArtifact(id: string) {
    if (!confirm(`Delete ${id}? This removes the artifact and any uploads it solely owns.`)) return;
    setBusy(true);
    const res = await fetch(`/api/admin/artifacts/${id}`, { method: 'DELETE' });
    setBusy(false);
    if (res.ok) router.refresh();
    else alert('Delete failed: ' + res.status);
  }

  async function deleteUpload(filename: string) {
    if (!confirm(`Delete upload ${filename}? The file and its uploads.json entry are removed.`)) return;
    setBusy(true);
    const res = await fetch(`/api/admin/uploads/${filename}`, { method: 'DELETE' });
    setBusy(false);
    if (res.ok) router.refresh();
    else alert('Delete failed: ' + res.status);
  }

  async function deleteSelected() {
    if (selRows.length === 0) return;
    if (!confirm(`Delete ${selRows.length} item${selRows.length === 1 ? '' : 's'}? Artifacts purge their owned uploads; uploads remove both file + registry entry.`)) return;
    setBusy(true);
    setProgress({ done: 0, total: selRows.length });
    const failed: string[] = [];
    for (let i = 0; i < selRows.length; i++) {
      const r = selRows[i];
      try {
        const url = r.rowKind === 'artifact'
          ? `/api/admin/artifacts/${r.artifact.id}`
          : `/api/admin/uploads/${r.upload.filename}`;
        const res = await fetch(url, { method: 'DELETE' });
        if (!res.ok) failed.push(r.id);
      } catch { failed.push(r.id); }
      setProgress({ done: i + 1, total: selRows.length });
    }
    setBusy(false);
    setProgress(null);
    setSel(new Set());
    if (failed.length) alert(`Deleted ${selRows.length - failed.length}/${selRows.length}. Failed: ${failed.join(', ')}`);
    router.refresh();
  }

  async function claimSelected(autoName: boolean) {
    if (selUploads.length === 0) return;
    const label = autoName ? 'auto-generated names' : 'original filenames';
    if (!confirm(`Promote ${selUploads.length} upload${selUploads.length === 1 ? '' : 's'} into artifacts with ${label}?`)) return;
    setBusy(true);
    const res = await fetch('/api/admin/artifacts/batch-claim', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ filenames: selUploads.map((r) => r.upload.filename), autoName }),
    });
    setBusy(false);
    if (!res.ok) { alert('Claim failed: ' + res.status); return; }
    setSel(new Set());
    router.refresh();
  }

  async function renameArtifact(id: string, title: string) {
    const res = await fetch(`/api/admin/artifacts/${id}`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title }),
    });
    if (res.ok) router.refresh();
    else alert('Rename failed: ' + res.status);
  }

  async function regenerateSelectedNames() {
    if (selArtifacts.length === 0) return;
    if (!confirm(`Overwrite titles on ${selArtifacts.length} artifact${selArtifacts.length === 1 ? '' : 's'} with random names?`)) return;
    setBusy(true);
    setProgress({ done: 0, total: selArtifacts.length });
    let failed = 0;
    for (let i = 0; i < selArtifacts.length; i++) {
      const a = selArtifacts[i].artifact;
      try {
        const res = await fetch(`/api/admin/artifacts/${a.id}`, {
          method: 'PUT',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ title: generateName() }),
        });
        if (!res.ok) failed += 1;
      } catch { failed += 1; }
      setProgress({ done: i + 1, total: selArtifacts.length });
    }
    setBusy(false);
    setProgress(null);
    setSel(new Set());
    if (failed) alert(`Renamed ${selArtifacts.length - failed}/${selArtifacts.length}.`);
    router.refresh();
  }

  return (
    <>
      <div className="adm-filter-bar">
        <div className="adm-filter-chips">
          <button type="button" className={`adm-chip${filter === 'all' ? ' on' : ''}`} onClick={() => setFilter('all')}>
            All <span className="adm-chip-n">{counts.all}</span>
          </button>
          <button type="button" className={`adm-chip${filter === 'artifacts' ? ' on' : ''}`} onClick={() => setFilter('artifacts')}>
            Artifacts <span className="adm-chip-n">{counts.artifacts}</span>
          </button>
          <button type="button" className={`adm-chip${filter === 'unclaimed' ? ' on' : ''}`} onClick={() => setFilter('unclaimed')}>
            Unclaimed <span className="adm-chip-n">{counts.unclaimed}</span>
          </button>
          <button type="button" className={`adm-chip${filter === 'no-images' ? ' on' : ''}`} onClick={() => setFilter('no-images')}>
            No images <span className="adm-chip-n">{counts.noImages}</span>
          </button>
        </div>
        <input
          type="text"
          className="adm-search"
          placeholder="Filter by id, title, production, filename…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <div className="adm-bulk-bar">
        <label className="adm-bulk-all">
          <input
            type="checkbox"
            checked={allChecked}
            ref={(el) => { if (el) el.indeterminate = someChecked; }}
            onChange={toggleAll}
          />
          <span>{sel.size === 0 ? `Select all (${visible.length})` : `${sel.size} selected`}</span>
        </label>
        <div className="adm-bulk-tools">
          {progress && (
            <span className="adm-bulk-progress">Working {progress.done}/{progress.total}…</span>
          )}
          {selUploads.length > 0 && (
            <>
              <button type="button" className="adm-btn ghost" onClick={() => claimSelected(true)} disabled={busy}>
                ⟳ Claim with random names ({selUploads.length})
              </button>
              <button type="button" className="adm-btn ghost" onClick={() => claimSelected(false)} disabled={busy}>
                Claim as-is ({selUploads.length})
              </button>
            </>
          )}
          {selArtifacts.length > 0 && (
            <button type="button" className="adm-btn ghost" onClick={regenerateSelectedNames} disabled={busy}>
              ⟳ Regenerate names ({selArtifacts.length})
            </button>
          )}
          <button
            type="button"
            className="adm-btn danger"
            onClick={deleteSelected}
            disabled={busy || sel.size === 0}
          >
            {busy && progress ? '…' : `Delete ${sel.size || ''}`.trim()}
          </button>
        </div>
      </div>

      <div className="adm-table-wrap">
      <table className="adm-table adm-asset-table">
        <thead>
          <tr>
            <th style={{ width: 28 }}></th>
            <th style={{ width: 52 }}></th>
            <th>ID</th>
            <th>Kind</th>
            <th>Title / Filename</th>
            <th>Year</th>
            <th>Production</th>
            <th>Status</th>
            <th>Imgs</th>
            <th style={{ textAlign: 'right' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {visible.map((r) => {
            const checked = sel.has(r.key);
            const thumb = thumbFor(r);
            if (r.rowKind === 'artifact') {
              const a = r.artifact;
              return (
                <tr key={r.key} className={`${checked ? 'adm-row-sel' : ''}`}>
                  <td>
                    <input type="checkbox" checked={checked} onChange={() => toggle(r.key)} disabled={busy} />
                  </td>
                  <td>
                    {thumb ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={thumb} alt="" className="adm-row-thumb" />
                    ) : (
                      <div className="adm-row-thumb adm-row-thumb-empty">—</div>
                    )}
                  </td>
                  <td>{a.id}</td>
                  <td>{KS[a.kind]} {a.kind}</td>
                  <td>
                    <Link href={`/admin/${a.id}/edit`}>{a.title}</Link>
                    <button
                      type="button"
                      className="adm-inline-gen"
                      title="Replace title with generated name"
                      onClick={() => renameArtifact(a.id, generateName())}
                      disabled={busy}
                    >⟳</button>
                  </td>
                  <td>{a.year}</td>
                  <td>{a.production}</td>
                  <td>{a.status}</td>
                  <td>{a.images?.length ?? 0}</td>
                  <td style={{ textAlign: 'right' }}>
                    <Link href={`/archive/${a.id}`} style={{ marginRight: 12, opacity: 0.6 }}>view</Link>
                    <Link href={`/admin/${a.id}/edit`} style={{ marginRight: 12 }}>edit</Link>
                    <button
                      type="button"
                      onClick={() => deleteArtifact(a.id)}
                      disabled={busy}
                      className="adm-row-del"
                    >
                      delete
                    </button>
                  </td>
                </tr>
              );
            }
            const u = r.upload;
            return (
              <tr key={r.key} className={`${checked ? 'adm-row-sel' : ''} adm-row-unclaimed`}>
                <td>
                  <input type="checkbox" checked={checked} onChange={() => toggle(r.key)} disabled={busy} />
                </td>
                <td>
                  {thumb ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={thumb} alt="" className="adm-row-thumb" />
                  ) : (
                    <div className="adm-row-thumb adm-row-thumb-empty">—</div>
                  )}
                </td>
                <td><span className="adm-unclaimed-tag">unclaimed</span></td>
                <td>—</td>
                <td>
                  <a href={u.src} target="_blank" rel="noreferrer" className="adm-upload-name" title={u.filename}>
                    {u.originalName}
                  </a>
                </td>
                <td>—</td>
                <td>—</td>
                <td>—</td>
                <td>{u.w && u.h ? `${u.w}×${u.h}` : '—'}</td>
                <td style={{ textAlign: 'right' }}>
                  <button
                    type="button"
                    className="adm-row-claim"
                    onClick={async () => {
                      setBusy(true);
                      const res = await fetch('/api/admin/artifacts/batch-claim', {
                        method: 'POST',
                        headers: { 'content-type': 'application/json' },
                        body: JSON.stringify({ filenames: [u.filename], autoName: true }),
                      });
                      setBusy(false);
                      if (res.ok) router.refresh();
                      else alert('Claim failed: ' + res.status);
                    }}
                    disabled={busy}
                    title="Promote to artifact with a generated random name"
                  >claim ⟳</button>
                  <button
                    type="button"
                    onClick={() => deleteUpload(u.filename)}
                    disabled={busy}
                    className="adm-row-del"
                    style={{ marginLeft: 12 }}
                  >
                    delete
                  </button>
                </td>
              </tr>
            );
          })}
          {visible.length === 0 && (
            <tr>
              <td colSpan={10} style={{ textAlign: 'center', padding: 24, opacity: 0.6 }}>
                No matches.
              </td>
            </tr>
          )}
        </tbody>
      </table>
      </div>
    </>
  );
}

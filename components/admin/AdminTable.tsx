'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { Artifact } from '@/types/artifact';
import { KS } from '@/lib/kinds';

export function AdminTable({ artifacts }: { artifacts: Artifact[] }) {
  const router = useRouter();
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);

  const allChecked = artifacts.length > 0 && sel.size === artifacts.length;
  const someChecked = sel.size > 0 && !allChecked;

  function toggle(id: string) {
    setSel((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSel(allChecked ? new Set() : new Set(artifacts.map((a) => a.id)));
  }

  async function deleteOne(id: string) {
    if (!confirm(`Delete ${id}? This removes it from artifacts.json and deletes its /public/artifacts/${id}/ folder.`)) return;
    setBusy(true);
    const res = await fetch(`/api/admin/artifacts/${id}`, { method: 'DELETE' });
    setBusy(false);
    if (res.ok) router.refresh();
    else alert('Delete failed: ' + res.status);
  }

  async function deleteSelected() {
    const ids = Array.from(sel);
    if (ids.length === 0) return;
    if (!confirm(`Delete ${ids.length} artifact${ids.length === 1 ? '' : 's'}? This removes them from artifacts.json and deletes their /public/artifacts/ folders. This cannot be undone.`)) return;
    setBusy(true);
    setProgress({ done: 0, total: ids.length });
    const failed: string[] = [];
    for (let i = 0; i < ids.length; i++) {
      const id = ids[i];
      try {
        const res = await fetch(`/api/admin/artifacts/${id}`, { method: 'DELETE' });
        if (!res.ok) failed.push(id);
      } catch {
        failed.push(id);
      }
      setProgress({ done: i + 1, total: ids.length });
    }
    setBusy(false);
    setProgress(null);
    setSel(new Set());
    if (failed.length) alert(`Deleted ${ids.length - failed.length}/${ids.length}. Failed: ${failed.join(', ')}`);
    router.refresh();
  }

  return (
    <>
      <div className="adm-bulk-bar">
        <label className="adm-bulk-all">
          <input
            type="checkbox"
            checked={allChecked}
            ref={(el) => { if (el) el.indeterminate = someChecked; }}
            onChange={toggleAll}
          />
          <span>{sel.size === 0 ? 'Select all' : `${sel.size} selected`}</span>
        </label>
        <div className="adm-bulk-tools">
          {progress && (
            <span className="adm-bulk-progress">Deleting {progress.done}/{progress.total}…</span>
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
      <table className="adm-table">
        <thead>
          <tr>
            <th style={{ width: 28 }}></th>
            <th>ID</th>
            <th>Kind</th>
            <th>Title</th>
            <th>Year</th>
            <th>Production</th>
            <th>Status</th>
            <th>Images</th>
            <th style={{ textAlign: 'right' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {artifacts.map((a) => {
            const checked = sel.has(a.id);
            return (
              <tr key={a.id} className={checked ? 'adm-row-sel' : ''}>
                <td>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(a.id)}
                    disabled={busy}
                  />
                </td>
                <td>{a.id}</td>
                <td>{KS[a.kind]} {a.kind}</td>
                <td><Link href={`/admin/${a.id}/edit`}>{a.title}</Link></td>
                <td>{a.year}</td>
                <td>{a.production}</td>
                <td>{a.status}</td>
                <td>{a.images?.length ?? 0}</td>
                <td style={{ textAlign: 'right' }}>
                  <Link href={`/archive/${a.id}`} style={{ marginRight: 12, opacity: 0.6 }}>view</Link>
                  <Link href={`/admin/${a.id}/edit`} style={{ marginRight: 12 }}>edit</Link>
                  <button
                    type="button"
                    onClick={() => deleteOne(a.id)}
                    disabled={busy}
                    style={{ color: '#b14a36', cursor: 'pointer', background: 'none', border: 'none', padding: 0, font: 'inherit' }}
                  >
                    delete
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      </div>
    </>
  );
}

'use client';
import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import type { UploadedFile } from '@/types/upload';

interface Props {
  files: UploadedFile[];
}

function key(f: UploadedFile) {
  return `${f.originalName}|${f.size}`;
}

export function UploadLibrary({ files }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  const { unique, duplicates } = useMemo(() => {
    const seen = new Map<string, UploadedFile>();
    const dupes: UploadedFile[] = [];
    for (const f of files) {
      const k = key(f);
      if (seen.has(k)) dupes.push(f);
      else seen.set(k, f);
    }
    return { unique: Array.from(seen.values()), duplicates: dupes };
  }, [files]);

  async function deleteOne(filename: string) {
    setBusy(filename);
    const res = await fetch(`/api/admin/uploads/${filename}`, { method: 'DELETE' });
    setBusy(null);
    if (res.ok) router.refresh();
    else alert('Delete failed: ' + res.status);
  }

  async function purgeDuplicates() {
    if (duplicates.length === 0) return;
    if (!confirm(`Remove ${duplicates.length} duplicate upload${duplicates.length === 1 ? '' : 's'}? The canonical (first) copy of each file is kept.`)) return;
    setBusy('__bulk__');
    for (const f of duplicates) {
      await fetch(`/api/admin/uploads/${f.filename}`, { method: 'DELETE' });
    }
    setBusy(null);
    router.refresh();
  }

  if (files.length === 0) return null;

  return (
    <section className="bl-library">
      <div className="bl-library-h">
        <span>Library</span>
        <span className="bl-library-count">{files.length}</span>
        {duplicates.length > 0 && (
          <>
            <span className="bl-library-dupes">{duplicates.length} duplicate{duplicates.length === 1 ? '' : 's'}</span>
            <button
              type="button"
              className="adm-btn ghost bl-library-purge"
              onClick={purgeDuplicates}
              disabled={busy !== null}
            >
              {busy === '__bulk__' ? 'Purging…' : 'Purge duplicates'}
            </button>
          </>
        )}
      </div>
      <div className="bl-lib-grid">
        {unique.map((f) => (
          <div key={f.filename} className="bl-lib-card">
            <a
              href={f.src}
              target="_blank"
              rel="noreferrer"
              className="bl-lib-thumb"
              title={`${f.originalName} · ${f.w ?? '?'}×${f.h ?? '?'}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={f.thumb} alt={f.originalName} />
            </a>
            <div className="bl-lib-name">{f.originalName}</div>
            <button
              type="button"
              className="bl-lib-del"
              onClick={() => deleteOne(f.filename)}
              disabled={busy !== null}
              title="Delete from library"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

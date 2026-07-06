'use client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState, type ChangeEvent } from 'react';

export default function ImportPage() {
  const router = useRouter();
  const [format, setFormat] = useState<'json' | 'csv'>('json');
  const [mode, setMode] = useState<'merge' | 'replace'>('merge');
  const [content, setContent] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    setContent(text);
    if (file.name.toLowerCase().endsWith('.csv')) setFormat('csv');
    else if (file.name.toLowerCase().endsWith('.json')) setFormat('json');
    e.target.value = '';
  }

  async function onSubmit() {
    if (!content.trim()) {
      setErr('paste or upload content first');
      return;
    }
    if (mode === 'replace' && !confirm('REPLACE will overwrite all artifacts. Continue?')) return;
    setBusy(true);
    setErr(null);
    setMsg(null);
    const res = await fetch('/api/admin/import', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ format, mode, content }),
    });
    setBusy(false);
    if (!res.ok) {
      setErr(`${res.status} ${await res.text()}`);
      return;
    }
    const data = (await res.json()) as { count: number; total: number };
    setMsg(`Imported ${data.count} rows. Total artifacts: ${data.total}.`);
    router.refresh();
  }

  return (
    <div className="adm-wrap">
      <div className="adm-h">
        <div style={{ display: 'flex', alignItems: 'baseline' }}>
          <h1>Import</h1>
          <span className="sub">bulk CSV / JSON · merge or replace</span>
        </div>
        <div className="adm-tools">
          <Link href="/admin" className="adm-btn ghost">← Back</Link>
        </div>
      </div>

      <div className="adm-form">
        <label>Format</label>
        <select value={format} onChange={(e) => setFormat(e.target.value as 'json' | 'csv')}>
          <option value="json">JSON</option>
          <option value="csv">CSV</option>
        </select>

        <label>Mode</label>
        <select value={mode} onChange={(e) => setMode(e.target.value as 'merge' | 'replace')}>
          <option value="merge">Merge (upsert by id)</option>
          <option value="replace">Replace (wipe + import)</option>
        </select>

        <label>File</label>
        <input type="file" accept=".json,.csv,application/json,text/csv" onChange={onFile} />

        <label>Content</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={16}
          placeholder={format === 'json' ? '[{"id":"JP-001","title":"…"}]' : 'id,title,year,kind,…'}
          style={{ fontFamily: 'var(--f-m)', fontSize: 11 }}
        />
      </div>

      {err && (
        <div style={{ padding: 12, background: '#b14a36', color: 'white', marginBottom: 14, fontSize: 11, borderRadius: 6 }}>
          {err}
        </div>
      )}
      {msg && (
        <div style={{ padding: 12, background: 'var(--accent)', color: 'var(--paper)', marginBottom: 14, fontSize: 11, borderRadius: 6 }}>
          {msg}
        </div>
      )}

      <div className="adm-actions">
        <button type="button" className="adm-btn" onClick={onSubmit} disabled={busy}>
          {busy ? 'Importing…' : 'Import'}
        </button>
      </div>
    </div>
  );
}

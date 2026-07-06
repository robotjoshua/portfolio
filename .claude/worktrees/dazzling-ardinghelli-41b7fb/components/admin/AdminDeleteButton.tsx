'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function AdminDeleteButton({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function onDelete() {
    if (!confirm(`Delete ${id}? This removes it from artifacts.json and deletes its /public/artifacts/${id}/ folder.`)) return;
    setBusy(true);
    const res = await fetch(`/api/admin/artifacts/${id}`, { method: 'DELETE' });
    setBusy(false);
    if (res.ok) router.refresh();
    else alert('Delete failed: ' + res.status);
  }

  return (
    <button onClick={onDelete} disabled={busy} style={{ color: '#b14a36', cursor: 'pointer' }}>
      {busy ? '…' : 'delete'}
    </button>
  );
}

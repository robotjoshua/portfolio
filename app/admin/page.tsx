import Link from 'next/link';
import { notFound } from 'next/navigation';
import { readArtifacts } from '@/lib/artifacts-server';
import { AdminTable } from '@/components/admin/AdminTable';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  if (process.env.NODE_ENV === 'production') notFound();
  const artifacts = await readArtifacts();
  return (
    <div className="adm-wrap">
      <div className="adm-h">
        <div style={{ display: 'flex', alignItems: 'baseline' }}>
          <h1>Admin</h1>
          <span className="sub">{artifacts.length} artifacts · dev-only</span>
        </div>
        <div className="adm-tools">
          <Link href="/admin/profile" className="adm-btn ghost">Profile</Link>
          <Link href="/admin/import" className="adm-btn ghost">Import</Link>
          <Link href="/admin/upload" className="adm-btn ghost">Upload</Link>
          <Link href="/admin/new" className="adm-btn">+ New Artifact</Link>
        </div>
      </div>

      <AdminTable artifacts={artifacts} />
    </div>
  );
}

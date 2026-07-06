import Link from 'next/link';
import { readArtifacts } from '@/lib/artifacts-server';
import { readUploads } from '@/lib/uploads-server';
import { AdminAssetTable } from '@/components/admin/AdminAssetTable';
import { ImageBatchLoader } from '@/components/admin/ImageBatchLoader';
import { AdminSignOutButton } from '@/components/admin/AdminSignOutButton';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const [artifacts, uploads] = await Promise.all([readArtifacts(), readUploads()]);

  return (
    <div className="adm-wrap">
      <div className="adm-h">
        <div style={{ display: 'flex', alignItems: 'baseline' }}>
          <h1>Admin</h1>
          <span className="sub">
            {artifacts.length} artifact{artifacts.length === 1 ? '' : 's'} ·{' '}
            {uploads.length} unclaimed upload{uploads.length === 1 ? '' : 's'}
          </span>
        </div>
        <div className="adm-tools">
          <Link href="/admin/profile" className="adm-btn ghost">Profile</Link>
          <Link href="/admin/import" className="adm-btn ghost">Import</Link>
          <Link href="/admin/new" className="adm-btn">+ New Artifact</Link>
          <AdminSignOutButton />
        </div>
      </div>

      <section className="adm-dropzone-block">
        <div className="adm-dropzone-h">⤓ Upload images</div>
        <ImageBatchLoader />
      </section>

      <AdminAssetTable artifacts={artifacts} uploads={uploads} />
    </div>
  );
}

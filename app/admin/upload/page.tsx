import Link from 'next/link';
import { notFound } from 'next/navigation';
import { readUploads } from '@/lib/uploads-server';
import { ImageBatchLoader } from '@/components/admin/ImageBatchLoader';
import { UploadLibrary } from '@/components/admin/UploadLibrary';

export const dynamic = 'force-dynamic';

export default async function AdminUploadPage() {
  if (process.env.NODE_ENV === 'production') notFound();
  const existing = await readUploads();

  return (
    <div className="adm-wrap">
      <div className="adm-h">
        <div style={{ display: 'flex', alignItems: 'baseline' }}>
          <h1>Upload</h1>
          <span className="sub">
            batch loader · {existing.length} in library · dev-only
          </span>
        </div>
        <div className="adm-tools">
          <Link href="/admin" className="adm-btn ghost">
            ← Admin
          </Link>
        </div>
      </div>

      <ImageBatchLoader />

      <UploadLibrary files={existing} />
    </div>
  );
}

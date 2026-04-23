import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArtifactForm } from '@/components/admin/ArtifactForm';

export const dynamic = 'force-dynamic';

export default function NewArtifactPage() {
  if (process.env.NODE_ENV === 'production') notFound();
  return (
    <div className="adm-wrap">
      <div className="adm-h">
        <div style={{ display: 'flex', alignItems: 'baseline' }}>
          <h1>New Artifact</h1>
          <span className="sub">create record · images after save</span>
        </div>
        <div className="adm-tools">
          <Link href="/admin" className="adm-btn ghost">← Back</Link>
        </div>
      </div>
      <ArtifactForm mode="create" />
    </div>
  );
}

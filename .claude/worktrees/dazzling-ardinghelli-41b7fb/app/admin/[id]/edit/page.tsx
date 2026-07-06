import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getArtifact } from '@/lib/artifacts-server';
import { ArtifactForm } from '@/components/admin/ArtifactForm';

export const dynamic = 'force-dynamic';

export default async function EditArtifactPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const rec = await getArtifact(id);
  if (!rec) notFound();
  return (
    <div className="adm-wrap">
      <div className="adm-h">
        <div style={{ display: 'flex', alignItems: 'baseline' }}>
          <h1>{rec.id}</h1>
          <span className="sub">{rec.title} · {rec.kind}</span>
        </div>
        <div className="adm-tools">
          <Link href={`/archive/${rec.id}`} className="adm-btn ghost">View</Link>
          <Link href="/admin" className="adm-btn ghost">← Back</Link>
        </div>
      </div>
      <ArtifactForm mode="edit" initial={rec} />
    </div>
  );
}

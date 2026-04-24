import { readArtifacts } from '@/lib/artifacts-server';
import { readUploads } from '@/lib/uploads-server';
import { synthesizeUnclaimed } from '@/lib/combined-artifacts';
import { CatalogView } from '@/components/CatalogView';

export const dynamic = 'force-dynamic';

export default async function CatalogPage() {
  const [artifacts, uploads] = await Promise.all([readArtifacts(), readUploads()]);
  const uncatalogued = synthesizeUnclaimed(artifacts, uploads);

  const combined = [...artifacts, ...uncatalogued];
  for (let i = combined.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [combined[i], combined[j]] = [combined[j], combined[i]];
  }

  return <CatalogView artifacts={combined} />;
}

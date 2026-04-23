import { readArtifacts } from '@/lib/artifacts-server';
import { readUploads } from '@/lib/uploads-server';
import { CatalogView } from '@/components/CatalogView';
import type { Artifact } from '@/types/artifact';

export const dynamic = 'force-dynamic';

export default async function CatalogPage() {
  const [artifacts, uploads] = await Promise.all([readArtifacts(), readUploads()]);

  const usedSrcs = new Set<string>();
  for (const a of artifacts) for (const img of a.images ?? []) usedSrcs.add(img.src);

  const seen = new Set<string>();
  const loose = uploads.filter((f) => {
    if (usedSrcs.has(f.src)) return false;
    const k = `${f.originalName}|${f.size}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });

  const baseIndex = artifacts.length;
  const uncatalogued: Artifact[] = loose.map((f, i) => ({
    id: `U-${String(baseIndex + i + 1).padStart(3, '0')}`,
    catNo: f.originalName,
    title: f.originalName,
    year: new Date(f.uploadedAt).getFullYear() || new Date().getFullYear(),
    kind: 'UNCLASSIFIED',
    production: '—',
    material: '—',
    finish: '—',
    status: 'UNSORTED',
    dims: '—',
    palette: ['#888888', '#aaaaaa', '#555555'],
    images: [{ src: f.src, thumb: f.thumb, w: f.w, h: f.h, alt: f.originalName }],
    index: baseIndex + i + 1,
    uploadedSrc: f.src,
  } as Artifact & { uploadedSrc: string }));

  const combined = [...artifacts, ...uncatalogued];
  for (let i = combined.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [combined[i], combined[j]] = [combined[j], combined[i]];
  }

  return <CatalogView artifacts={combined} />;
}

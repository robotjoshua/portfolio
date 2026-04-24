import 'server-only';
import type { Artifact } from '@/types/artifact';
import type { UploadedFile } from '@/types/upload';
import { readArtifacts } from '@/lib/artifacts-server';
import { readUploads } from '@/lib/uploads-server';

// Synthesize Artifact rows for uploads that aren't yet attached to any real
// artifact. Catalog and Record both consume this so the SCAN / grid cover
// every image in the library, not just the 33 fully-catalogued ones.
export function synthesizeUnclaimed(
  artifacts: Artifact[],
  uploads: UploadedFile[],
): Artifact[] {
  const usedSrcs = new Set<string>();
  for (const a of artifacts) for (const img of a.images ?? []) usedSrcs.add(img.src);

  const seen = new Set<string>();
  const loose = uploads.filter((f) => {
    if (usedSrcs.has(f.src)) return false;
    // Prefer dedupe by filename (stable across re-uploads of the same file).
    if (seen.has(f.filename)) return false;
    seen.add(f.filename);
    return true;
  });

  const baseIndex = artifacts.reduce((m, a) => Math.max(m, a.index), 0);
  return loose.map<Artifact>((f, i) => ({
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
  }));
}

/** Real artifacts + synthesized U-* rows for any unclaimed uploads. */
export async function readCombinedArtifacts(): Promise<Artifact[]> {
  const [artifacts, uploads] = await Promise.all([readArtifacts(), readUploads()]);
  return [...artifacts, ...synthesizeUnclaimed(artifacts, uploads)];
}

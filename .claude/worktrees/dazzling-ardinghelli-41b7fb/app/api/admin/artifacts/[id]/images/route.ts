import { NextRequest, NextResponse } from 'next/server';
import { readArtifacts, getArtifact, upsertArtifact } from '@/lib/artifacts-server';
import { removeUpload } from '@/lib/uploads-server';
import { deleteImage } from '@/lib/blobs';
import type { ArtifactImage } from '@/types/artifact';
import { guardAdmin } from '../../../_guard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function uploadFilenameFromSrc(src: string | undefined): string | null {
  if (!src) return null;
  const legacy = src.match(/^\/uploads\/([^/?#]+)$/);
  if (legacy) return legacy[1];
  const blob = src.match(/^\/api\/img\/uploads\/([^/?#]+)$/);
  if (blob) return decodeURIComponent(blob[1]);
  return null;
}

function artifactKeyFromSrc(src: string | undefined, id: string): string | null {
  if (!src) return null;
  const legacy = src.match(new RegExp(`^/artifacts/${id}/([^/?#]+)$`));
  if (legacy) return `artifacts/${id}/${legacy[1]}`;
  const blob = src.match(new RegExp(`^/api/img/artifacts/${id}/([^/?#]+)$`));
  if (blob) return `artifacts/${id}/${decodeURIComponent(blob[1])}`;
  return null;
}

function filesClaimedByImage(img: ArtifactImage): string[] {
  const out: string[] = [];
  const full = uploadFilenameFromSrc(img.src);
  const thumb = uploadFilenameFromSrc(img.thumb);
  if (full) out.push(full);
  if (thumb && thumb !== full) out.push(thumb);
  return out;
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const blocked = await guardAdmin(req);
  if (blocked) return blocked;
  const { id } = await ctx.params;
  const { src } = (await req.json()) as { src?: string };
  if (!src) return NextResponse.json({ error: 'missing src' }, { status: 400 });

  const artifact = await getArtifact(id);
  if (!artifact) return new NextResponse('Not found', { status: 404 });

  const removedImg = (artifact.images ?? []).find((i) => i.src === src);
  if (!removedImg) return NextResponse.json({ error: 'image not found' }, { status: 404 });

  const nextImages = (artifact.images ?? []).filter((i) => i.src !== src);
  const updated = { ...artifact, images: nextImages, updatedAt: new Date().toISOString() };
  await upsertArtifact(updated);

  const all = await readArtifacts();
  const candidates = filesClaimedByImage(removedImg);
  const stillReferenced = new Set<string>();
  for (const a of all) {
    for (const img of a.images ?? []) {
      const f1 = uploadFilenameFromSrc(img.src);
      const f2 = uploadFilenameFromSrc(img.thumb);
      if (f1) stillReferenced.add(f1);
      if (f2) stillReferenced.add(f2);
    }
  }

  const purged: string[] = [];
  for (const filename of candidates) {
    if (stillReferenced.has(filename)) continue;
    try { await deleteImage(`uploads/${filename}`); } catch { /* ok */ }
    try { await removeUpload(filename); } catch { /* ok */ }
    purged.push(filename);
  }

  const artKey = artifactKeyFromSrc(src, id);
  if (artKey) {
    try { await deleteImage(artKey); } catch { /* ok */ }
    // best-effort thumb too
    const thumbKey = artKey.replace(/\.webp$/, '-thumb.webp');
    if (thumbKey !== artKey) {
      try { await deleteImage(thumbKey); } catch { /* ok */ }
    }
  }

  return NextResponse.json({ ok: true, artifact: updated, purged });
}

import { NextRequest, NextResponse } from 'next/server';
import { readArtifacts, getArtifact, upsertArtifact, deleteArtifact } from '@/lib/artifacts-server';
import { removeUpload } from '@/lib/uploads-server';
import { deleteImage, listImages } from '@/lib/blobs';
import type { Artifact, ArtifactImage } from '@/types/artifact';
import { guardAdmin } from '../../_guard';

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

function claimedUploadFilenames(images: ArtifactImage[] | undefined): Set<string> {
  const out = new Set<string>();
  for (const img of images ?? []) {
    const full = uploadFilenameFromSrc(img.src);
    const thumb = uploadFilenameFromSrc(img.thumb);
    if (full) out.add(full);
    if (thumb) out.add(thumb);
  }
  return out;
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const blocked = await guardAdmin(req);
  if (blocked) return blocked;
  const { id } = await ctx.params;
  const found = await getArtifact(id);
  return found ? NextResponse.json(found) : new NextResponse('Not found', { status: 404 });
}

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const blocked = await guardAdmin(req);
  if (blocked) return blocked;
  const { id } = await ctx.params;
  const body = (await req.json()) as Partial<Artifact>;
  const existing = await getArtifact(id);
  if (!existing) return new NextResponse('Not found', { status: 404 });

  const merged: Artifact = {
    ...existing,
    ...body,
    id,
    index: existing.index,
    createdAt: existing.createdAt,
    updatedAt: new Date().toISOString(),
  };
  await upsertArtifact(merged);
  return NextResponse.json(merged);
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const blocked = await guardAdmin(req);
  if (blocked) return blocked;
  const { id } = await ctx.params;
  const target = await getArtifact(id);
  if (!target) return new NextResponse('Not found', { status: 404 });

  const all = await readArtifacts();
  const others = all.filter((a) => a.id !== id);

  const stillReferenced = new Set<string>();
  for (const a of others) {
    for (const fn of claimedUploadFilenames(a.images)) stillReferenced.add(fn);
  }
  const toPurge = [...claimedUploadFilenames(target.images)].filter((fn) => !stillReferenced.has(fn));

  for (const filename of toPurge) {
    try { await deleteImage(`uploads/${filename}`); } catch { /* ok */ }
    try { await removeUpload(filename); } catch { /* ok */ }
  }

  // Remove the artifact's own images/* blobs
  try {
    const keys = await listImages(`artifacts/${id}/`);
    await Promise.all(keys.map((k) => deleteImage(k)));
  } catch { /* ok */ }

  await deleteArtifact(id);
  return NextResponse.json({ ok: true, purgedUploads: toPurge });
}

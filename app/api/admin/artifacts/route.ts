import { NextRequest, NextResponse } from 'next/server';
import { readArtifacts, upsertArtifact, nextArtifactId, getArtifact } from '@/lib/artifacts-server';
import { removeUpload } from '@/lib/uploads-server';
import type { Artifact, ArtifactImage } from '@/types/artifact';
import { guardAdmin } from '../_guard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Extract filename if src points into the uploads namespace. Accepts both the
// legacy `/uploads/foo.webp` shape and the new `/api/img/uploads/foo.webp`.
function uploadFilenameFromSrc(src: string | undefined): string | null {
  if (!src) return null;
  const legacy = src.match(/^\/uploads\/([^/?#]+)$/);
  if (legacy) return legacy[1];
  const blob = src.match(/^\/api\/img\/uploads\/([^/?#]+)$/);
  if (blob) return decodeURIComponent(blob[1]);
  return null;
}

function claimedUploadBases(images: ArtifactImage[] | undefined): Set<string> {
  const out = new Set<string>();
  for (const img of images ?? []) {
    const full = uploadFilenameFromSrc(img.src);
    const thumb = uploadFilenameFromSrc(img.thumb);
    if (full) out.add(full);
    if (thumb) out.add(thumb);
  }
  return out;
}

export async function GET(req: NextRequest) {
  const blocked = await guardAdmin(req);
  if (blocked) return blocked;
  const all = await readArtifacts();
  return NextResponse.json(all);
}

export async function POST(req: NextRequest) {
  const blocked = await guardAdmin(req);
  if (blocked) return blocked;

  const body = (await req.json()) as Partial<Artifact>;

  const { id, index } = body.id && body.index
    ? { id: body.id, index: body.index }
    : await nextArtifactId();

  if (await getArtifact(id)) {
    return NextResponse.json({ error: 'id already exists' }, { status: 409 });
  }

  const now = new Date().toISOString();
  const record: Artifact = {
    id,
    index,
    catNo: body.catNo || `${body.kind || 'TECH'}.${body.year || new Date().getFullYear()}.${String(index).padStart(2, '0')}`,
    title: body.title || 'Untitled',
    year: body.year || new Date().getFullYear(),
    kind: body.kind || 'TECH',
    production: body.production || '',
    material: body.material || '',
    finish: body.finish || '',
    status: body.status || 'ARCHIVE',
    dims: body.dims || '',
    palette: (body.palette as Artifact['palette']) || ['#1a1a18', '#7a7868', '#dcdad0'],
    note: body.note || '',
    images: body.images || [],
    showOnIndex: body.showOnIndex !== false,
    createdAt: now,
    updatedAt: now,
  };

  await upsertArtifact(record);

  // Claim any uploads this artifact references — remove them from the uploads table so
  // they no longer appear as synthetic U-* items. Blob data stays intact.
  const claimed = claimedUploadBases(record.images);
  for (const filename of claimed) {
    try { await removeUpload(filename); } catch { /* ok */ }
  }

  return NextResponse.json(record, { status: 201 });
}

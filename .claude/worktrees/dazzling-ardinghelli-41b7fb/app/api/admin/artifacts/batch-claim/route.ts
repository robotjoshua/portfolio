import { NextRequest, NextResponse } from 'next/server';
import { readArtifacts, upsertArtifact, nextArtifactId } from '@/lib/artifacts-server';
import { readUploads, removeUpload } from '@/lib/uploads-server';
import type { Artifact } from '@/types/artifact';
import type { UploadedFile } from '@/types/upload';
import { generateName } from '@/lib/namegen';
import { guardAdmin } from '../../_guard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface BatchClaimBody {
  /** upload filenames (from uploads.json) to promote into artifacts */
  filenames?: string[];
  /** default kind/status for all promoted artifacts */
  kind?: string;
  status?: string;
  /** if true, autogenerate a random title for each */
  autoName?: boolean;
}

// Promote one or more uploads into real artifacts. Each upload becomes a new
// artifact with a single image. Promoted uploads are removed from uploads.json
// (their physical files stay on disk, now owned by the artifact).
export async function POST(req: NextRequest) {
  const blocked = await guardAdmin(req);
  if (blocked) return blocked;

  const body = (await req.json()) as BatchClaimBody;
  const filenames = body.filenames ?? [];
  if (!Array.isArray(filenames) || filenames.length === 0) {
    return NextResponse.json({ error: 'no filenames provided' }, { status: 400 });
  }

  const uploads = await readUploads();
  const byName = new Map<string, UploadedFile>(uploads.map((u) => [u.filename, u]));
  const claimed: UploadedFile[] = [];
  const missing: string[] = [];
  for (const fn of filenames) {
    const u = byName.get(fn);
    if (u) claimed.push(u);
    else missing.push(fn);
  }

  if (claimed.length === 0) {
    return NextResponse.json({ error: 'no valid uploads', missing }, { status: 404 });
  }

  const allArtifacts = await readArtifacts();
  const created: Artifact[] = [];
  const now = new Date().toISOString();
  // Seed the index counter from the current max, bump per item so writes cluster.
  let nextIdx = allArtifacts.reduce((m, a) => Math.max(m, a.index), 0) + 1;

  for (const u of claimed) {
    const { id, index } = { id: `JP-${String(nextIdx).padStart(3, '0')}`, index: nextIdx };
    nextIdx += 1;

    const title = body.autoName ? generateName() : (u.originalName.replace(/\.[^.]+$/, '') || 'Untitled');
    const kind = body.kind || 'TECH';
    const year = new Date().getFullYear();

    const record: Artifact = {
      id,
      index,
      catNo: `${kind}.${year}.${String(index).padStart(2, '0')}`,
      title,
      year,
      kind,
      production: '',
      material: '',
      finish: '',
      status: body.status || 'ARCHIVE',
      dims: '',
      palette: ['#1a1a18', '#7a7868', '#dcdad0'],
      note: '',
      images: [
        { src: u.src, thumb: u.thumb, w: u.w, h: u.h, alt: u.originalName },
      ],
      showOnIndex: true,
      createdAt: now,
      updatedAt: now,
    };
    created.push(record);
  }

  // Ensure no id collision (defensive; nextArtifactId() accounts for index).
  const existingIds = new Set(allArtifacts.map((a) => a.id));
  for (const c of created) {
    if (existingIds.has(c.id)) {
      // extremely unlikely, but regenerate via nextArtifactId if it happens
      const { id, index } = await nextArtifactId();
      c.id = id;
      c.index = index;
    }
  }

  for (const c of created) {
    await upsertArtifact(c);
  }

  for (const u of claimed) {
    try { await removeUpload(u.filename); } catch { /* ok */ }
  }

  return NextResponse.json({
    ok: true,
    created: created.map((c) => ({ id: c.id, title: c.title, filename: claimed.find((u) => c.images?.[0]?.src === u.src)?.filename })),
    count: created.length,
    missing,
  });
}

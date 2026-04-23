import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { readArtifacts, writeArtifacts } from '@/lib/artifacts-server';
import type { ArtifactImage } from '@/types/artifact';
import { guardDev } from '../_guard';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const blocked = guardDev();
  if (blocked) return blocked;

  const form = await req.formData();
  const id = String(form.get('id') || '');
  if (!id) return NextResponse.json({ error: 'missing id' }, { status: 400 });

  const all = await readArtifacts();
  const rec = all.find((a) => a.id === id);
  if (!rec) return NextResponse.json({ error: 'artifact not found' }, { status: 404 });

  const files = form.getAll('files').filter((f): f is File => f instanceof File);
  if (files.length === 0) return NextResponse.json({ error: 'no files' }, { status: 400 });

  const dir = path.join(process.cwd(), 'public', 'artifacts', id);
  await fs.mkdir(dir, { recursive: true });

  const added: ArtifactImage[] = [];
  const existingCount = rec.images?.length ?? 0;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const buf = Buffer.from(await file.arrayBuffer());
    const slot = existingCount + i + 1;
    const base = String(slot).padStart(3, '0');
    const fullName = `${base}.webp`;
    const thumbName = `${base}-thumb.webp`;

    // Separate sharp instances for each operation — reusing one instance after
    // a terminal call (.metadata / .toFile) produces corrupt or empty output.
    let meta: sharp.Metadata;
    try {
      meta = await sharp(buf).metadata();
    } catch (e) {
      console.error('[upload] metadata failed:', e);
      continue;
    }

    let fullBuf: Buffer;
    try {
      fullBuf = await sharp(buf).rotate().withMetadata().webp({ quality: 86 }).toBuffer();
    } catch (e) {
      console.error('[upload] full image failed:', e);
      continue;
    }

    let thumbBuf: Buffer;
    try {
      thumbBuf = await sharp(buf).rotate().resize(400, 400, { fit: 'cover' }).webp({ quality: 78 }).toBuffer();
    } catch (e) {
      console.warn('[upload] thumb failed, using full image:', e);
      thumbBuf = fullBuf;
    }

    await fs.writeFile(path.join(dir, fullName), fullBuf);
    await fs.writeFile(path.join(dir, thumbName), thumbBuf);

    added.push({
      src: `/artifacts/${id}/${fullName}`,
      thumb: `/artifacts/${id}/${thumbName}`,
      w: meta.width,
      h: meta.height,
    });
  }

  if (added.length === 0) {
    return NextResponse.json({ error: 'all files failed to process' }, { status: 422 });
  }

  rec.images = [...(rec.images ?? []), ...added];
  rec.updatedAt = new Date().toISOString();
  await writeArtifacts(all);

  return NextResponse.json({ images: rec.images });
}

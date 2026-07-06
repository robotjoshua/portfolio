import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { getArtifact, upsertArtifact } from '@/lib/artifacts-server';
import { putImage, imgUrl } from '@/lib/blobs';
import type { ArtifactImage } from '@/types/artifact';
import { guardAdmin } from '../_guard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const blocked = await guardAdmin(req);
  if (blocked) return blocked;

  const form = await req.formData();
  const id = String(form.get('id') || '');
  if (!id) return NextResponse.json({ error: 'missing id' }, { status: 400 });

  const rec = await getArtifact(id);
  if (!rec) return NextResponse.json({ error: 'artifact not found' }, { status: 404 });

  const files = form.getAll('files').filter((f): f is File => f instanceof File);
  if (files.length === 0) return NextResponse.json({ error: 'no files' }, { status: 400 });

  const added: ArtifactImage[] = [];
  const existingCount = rec.images?.length ?? 0;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const buf = Buffer.from(await file.arrayBuffer());
    const isGif = file.type === 'image/gif' || buf.slice(0, 4).toString('ascii') === 'GIF8';
    const slot = existingCount + i + 1;
    const base = String(slot).padStart(3, '0');
    const fullExt = isGif ? 'gif' : 'webp';
    const fullName = `${base}.${fullExt}`;
    const thumbName = `${base}-thumb.webp`;
    const fullType = isGif ? 'image/gif' : 'image/webp';

    let meta: sharp.Metadata;
    try {
      meta = await sharp(buf).metadata();
    } catch (e) {
      console.error('[upload] metadata failed:', e);
      continue;
    }

    let fullBuf: Buffer;
    if (isGif) {
      fullBuf = buf;
    } else {
      try {
        fullBuf = await sharp(buf).rotate().withMetadata().webp({ quality: 86 }).toBuffer();
      } catch (e) {
        console.error('[upload] full image failed:', e);
        continue;
      }
    }

    let thumbBuf: Buffer;
    try {
      thumbBuf = await sharp(buf, { animated: false }).rotate().resize(400, 400, { fit: 'cover' }).webp({ quality: 78 }).toBuffer();
    } catch (e) {
      console.warn('[upload] thumb failed, using full image:', e);
      thumbBuf = isGif ? await sharp(buf, { animated: false }).webp({ quality: 78 }).toBuffer() : fullBuf;
    }

    const fullKey = `artifacts/${id}/${fullName}`;
    const thumbKey = `artifacts/${id}/${thumbName}`;
    await putImage(fullKey, fullBuf, fullType);
    await putImage(thumbKey, thumbBuf, 'image/webp');

    added.push({
      src: imgUrl(fullKey),
      thumb: imgUrl(thumbKey),
      w: meta.width,
      h: meta.height,
    });
  }

  if (added.length === 0) {
    return NextResponse.json({ error: 'all files failed to process' }, { status: 422 });
  }

  const updated = {
    ...rec,
    images: [...(rec.images ?? []), ...added],
    updatedAt: new Date().toISOString(),
  };
  await upsertArtifact(updated);

  return NextResponse.json({ images: updated.images });
}

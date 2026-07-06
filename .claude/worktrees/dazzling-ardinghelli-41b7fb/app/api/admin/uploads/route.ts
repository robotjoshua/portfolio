import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { appendUpload, readUploads } from '@/lib/uploads-server';
import { putImage, imgUrl } from '@/lib/blobs';
import type { UploadedFile } from '@/types/upload';
import { guardAdmin } from '../_guard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ALLOWED = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
  'image/tiff',
  'image/bmp',
  'image/heic',
  'image/heif',
  'image/svg+xml',
  'image/x-icon',
  'application/octet-stream',
]);

function safeSlug(name: string): string {
  const base = name.replace(/\.[^.]+$/, '');
  return base
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'image';
}

export async function GET(req: NextRequest) {
  const blocked = await guardAdmin(req);
  if (blocked) return blocked;
  const files = await readUploads();
  return NextResponse.json({ files });
}

export async function POST(req: NextRequest) {
  const blocked = await guardAdmin(req);
  if (blocked) return blocked;

  try {
    const form = await req.formData();
    const file = form.get('file');
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'no file' }, { status: 400 });
    }
    const looksLikeImage =
      file.type.startsWith('image/') ||
      /\.(jpe?g|png|webp|gif|avif|tiff?|bmp|heic|heif|svg|ico)$/i.test(file.name);
    if (!ALLOWED.has(file.type) && !looksLikeImage) {
      return NextResponse.json({ error: `unsupported type: ${file.type}` }, { status: 400 });
    }

    const buf = Buffer.from(await file.arrayBuffer());
    const isGif = file.type === 'image/gif' || buf.slice(0, 4).toString('ascii') === 'GIF8';
    const stamp = Date.now().toString(36);
    const slug = safeSlug(file.name);
    const base = `${stamp}-${slug}`;
    const fullExt = isGif ? 'gif' : 'webp';
    const fullName = `${base}.${fullExt}`;
    const thumbName = `${base}-thumb.webp`;
    const fullType = isGif ? 'image/gif' : 'image/webp';

    let meta: sharp.Metadata;
    try {
      meta = await sharp(buf).metadata();
    } catch (e) {
      console.error('[upload] metadata failed:', e);
      return NextResponse.json({ error: 'could not read image metadata' }, { status: 400 });
    }

    let fullBuf: Buffer;
    if (isGif) {
      fullBuf = buf;
    } else {
      try {
        fullBuf = await sharp(buf).rotate().withMetadata().webp({ quality: 94, effort: 5 }).toBuffer();
      } catch (e) {
        console.error('[upload] full image conversion failed:', e);
        return NextResponse.json({ error: 'image conversion failed' }, { status: 422 });
      }
    }

    const fullKey = `uploads/${fullName}`;
    await putImage(fullKey, fullBuf, fullType);

    let thumbSrc = imgUrl(fullKey);
    try {
      const thumbBuf = await sharp(buf, { animated: false })
        .rotate()
        .resize(640, 640, { fit: 'cover' })
        .webp({ quality: 82 })
        .toBuffer();
      const thumbKey = `uploads/${thumbName}`;
      await putImage(thumbKey, thumbBuf, 'image/webp');
      thumbSrc = imgUrl(thumbKey);
    } catch (e) {
      console.warn('[upload] thumbnail generation failed (using full image):', e);
    }

    const record: UploadedFile = {
      filename: fullName,
      originalName: file.name,
      src: imgUrl(fullKey),
      thumb: thumbSrc,
      size: fullBuf.length,
      w: meta.width,
      h: meta.height,
      uploadedAt: new Date().toISOString(),
    };

    await appendUpload(record);
    return NextResponse.json({ file: record });
  } catch (e) {
    console.error('[upload]', e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

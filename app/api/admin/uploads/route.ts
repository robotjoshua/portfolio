import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { appendUpload, readUploads } from '@/lib/uploads-server';
import type { UploadedFile } from '@/types/upload';
import { guardDev } from '../_guard';

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

export async function GET() {
  const blocked = guardDev();
  if (blocked) return blocked;
  const files = await readUploads();
  return NextResponse.json({ files });
}

export async function POST(req: NextRequest) {
  const blocked = guardDev();
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

    const dir = path.join(process.cwd(), 'public', 'uploads');
    await fs.mkdir(dir, { recursive: true });

    const buf = Buffer.from(await file.arrayBuffer());
    const stamp = Date.now().toString(36);
    const slug = safeSlug(file.name);
    const base = `${stamp}-${slug}`;
    const fullName = `${base}.webp`;
    const thumbName = `${base}-thumb.webp`;

    // Read metadata first — if this fails the image is unreadable
    let meta: sharp.Metadata;
    try {
      meta = await sharp(buf).metadata();
    } catch (e) {
      console.error('[upload] metadata failed:', e);
      return NextResponse.json({ error: 'could not read image metadata' }, { status: 400 });
    }

    // Convert to WebP — use toBuffer() so no orphan file on failure
    let fullBuf: Buffer;
    try {
      fullBuf = await sharp(buf).rotate().withMetadata().webp({ quality: 94, effort: 5 }).toBuffer();
    } catch (e) {
      console.error('[upload] full image conversion failed:', e);
      return NextResponse.json({ error: 'image conversion failed' }, { status: 422 });
    }

    await fs.writeFile(path.join(dir, fullName), fullBuf);

    // Thumbnail is best-effort — failure is non-fatal
    let thumbSrc = `/uploads/${fullName}`;
    try {
      const thumbBuf = await sharp(buf)
        .rotate()
        .resize(640, 640, { fit: 'cover' })
        .webp({ quality: 82 })
        .toBuffer();
      await fs.writeFile(path.join(dir, thumbName), thumbBuf);
      thumbSrc = `/uploads/${thumbName}`;
    } catch (e) {
      console.warn('[upload] thumbnail generation failed (using full image):', e);
    }

    const record: UploadedFile = {
      filename: fullName,
      originalName: file.name,
      src: `/uploads/${fullName}`,
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

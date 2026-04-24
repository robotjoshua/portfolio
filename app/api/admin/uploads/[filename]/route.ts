import { NextRequest, NextResponse } from 'next/server';
import { removeUpload } from '@/lib/uploads-server';
import { deleteImage } from '@/lib/blobs';
import { guardAdmin } from '../../_guard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ filename: string }> },
) {
  const blocked = await guardAdmin(req);
  if (blocked) return blocked;

  const { filename } = await ctx.params;
  if (!/^[a-z0-9-]+\.webp$/i.test(filename)) {
    return NextResponse.json({ error: 'bad filename' }, { status: 400 });
  }

  const removed = await removeUpload(filename);
  if (!removed) return NextResponse.json({ error: 'not found' }, { status: 404 });

  const base = filename.replace(/\.webp$/i, '');
  await Promise.allSettled([
    deleteImage(`uploads/${filename}`),
    deleteImage(`uploads/${base}-thumb.webp`),
  ]);

  return NextResponse.json({ ok: true });
}

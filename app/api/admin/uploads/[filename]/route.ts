import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { removeUpload } from '@/lib/uploads-server';
import { guardDev } from '../../_guard';

export const dynamic = 'force-dynamic';

export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ filename: string }> },
) {
  const blocked = guardDev();
  if (blocked) return blocked;

  const { filename } = await ctx.params;
  if (!/^[a-z0-9-]+\.webp$/i.test(filename)) {
    return NextResponse.json({ error: 'bad filename' }, { status: 400 });
  }

  const removed = await removeUpload(filename);
  if (!removed) return NextResponse.json({ error: 'not found' }, { status: 404 });

  const dir = path.join(process.cwd(), 'public', 'uploads');
  const base = filename.replace(/\.webp$/i, '');
  await Promise.allSettled([
    fs.unlink(path.join(dir, filename)),
    fs.unlink(path.join(dir, `${base}-thumb.webp`)),
  ]);

  return NextResponse.json({ ok: true });
}

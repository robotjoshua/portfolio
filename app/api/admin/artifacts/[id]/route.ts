import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { readArtifacts, writeArtifacts } from '@/lib/artifacts-server';
import type { Artifact } from '@/types/artifact';
import { guardDev } from '../../_guard';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const blocked = guardDev();
  if (blocked) return blocked;
  const { id } = await ctx.params;
  const all = await readArtifacts();
  const found = all.find((a) => a.id === id);
  return found ? NextResponse.json(found) : new NextResponse('Not found', { status: 404 });
}

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const blocked = guardDev();
  if (blocked) return blocked;
  const { id } = await ctx.params;
  const body = (await req.json()) as Partial<Artifact>;
  const all = await readArtifacts();
  const idx = all.findIndex((a) => a.id === id);
  if (idx === -1) return new NextResponse('Not found', { status: 404 });

  const merged: Artifact = {
    ...all[idx],
    ...body,
    id,
    index: all[idx].index,
    createdAt: all[idx].createdAt,
    updatedAt: new Date().toISOString(),
  };
  all[idx] = merged;
  await writeArtifacts(all);
  return NextResponse.json(merged);
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const blocked = guardDev();
  if (blocked) return blocked;
  const { id } = await ctx.params;
  const all = await readArtifacts();
  const next = all.filter((a) => a.id !== id);
  if (next.length === all.length) return new NextResponse('Not found', { status: 404 });

  const dir = path.join(process.cwd(), 'public', 'artifacts', id);
  try {
    await fs.rm(dir, { recursive: true, force: true });
  } catch { /* ok */ }

  await writeArtifacts(next);
  return NextResponse.json({ ok: true });
}

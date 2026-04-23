import { NextRequest, NextResponse } from 'next/server';
import { readArtifacts, writeArtifacts, nextArtifactId } from '@/lib/artifacts-server';
import type { Artifact } from '@/types/artifact';
import { guardDev } from '../_guard';

export const dynamic = 'force-dynamic';

export async function GET() {
  const blocked = guardDev();
  if (blocked) return blocked;
  const all = await readArtifacts();
  return NextResponse.json(all);
}

export async function POST(req: NextRequest) {
  const blocked = guardDev();
  if (blocked) return blocked;

  const body = (await req.json()) as Partial<Artifact>;
  const all = await readArtifacts();

  const { id, index } = body.id && body.index
    ? { id: body.id, index: body.index }
    : await nextArtifactId();

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
    createdAt: now,
    updatedAt: now,
  };

  if (all.some((a) => a.id === record.id)) {
    return NextResponse.json({ error: 'id already exists' }, { status: 409 });
  }

  await writeArtifacts([...all, record]);
  return NextResponse.json(record, { status: 201 });
}

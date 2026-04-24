import { NextRequest, NextResponse } from 'next/server';
import Papa from 'papaparse';
import { readArtifacts, writeArtifacts } from '@/lib/artifacts-server';
import type { Artifact } from '@/types/artifact';
import { guardAdmin } from '../_guard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Mode = 'merge' | 'replace';

interface ImportBody {
  format: 'json' | 'csv';
  mode: Mode;
  content: string;
}

function coerceArtifact(row: Record<string, unknown>, fallbackIndex: number): Artifact {
  const id = String(row.id || `JP-${String(fallbackIndex).padStart(3, '0')}`);
  const index = Number(row.index) || fallbackIndex;
  const palRaw = row.palette;
  let palette: Artifact['palette'] = ['#1a1a18', '#7a7868', '#dcdad0'];
  if (Array.isArray(palRaw) && palRaw.length >= 3) {
    palette = [String(palRaw[0]), String(palRaw[1]), String(palRaw[2])];
  } else if (typeof palRaw === 'string') {
    const parts = palRaw.split(/[,|]/).map((s) => s.trim()).filter(Boolean);
    if (parts.length >= 3) palette = [parts[0], parts[1], parts[2]];
  }
  const now = new Date().toISOString();
  return {
    id,
    index,
    catNo: String(row.catNo || ''),
    title: String(row.title || 'Untitled'),
    year: Number(row.year) || new Date().getFullYear(),
    kind: (row.kind as Artifact['kind']) || 'TECH',
    production: String(row.production || ''),
    material: String(row.material || ''),
    finish: String(row.finish || ''),
    status: (row.status as Artifact['status']) || 'ARCHIVE',
    dims: String(row.dims || ''),
    palette,
    note: String(row.note || ''),
    images: Array.isArray(row.images) ? (row.images as Artifact['images']) : [],
    createdAt: String(row.createdAt || now),
    updatedAt: now,
  };
}

export async function POST(req: NextRequest) {
  const blocked = await guardAdmin(req);
  if (blocked) return blocked;

  const body = (await req.json()) as ImportBody;
  let rows: Record<string, unknown>[] = [];

  if (body.format === 'json') {
    const parsed = JSON.parse(body.content);
    rows = Array.isArray(parsed) ? parsed : [parsed];
  } else {
    const result = Papa.parse<Record<string, unknown>>(body.content, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
    });
    rows = result.data;
  }

  const existing = await readArtifacts();
  const maxIdx = existing.reduce((m, a) => Math.max(m, a.index), 0);

  const imported = rows.map((r, i) => coerceArtifact(r, maxIdx + i + 1));

  let merged: Artifact[];
  if (body.mode === 'replace') {
    merged = imported;
  } else {
    const byId = new Map(existing.map((a) => [a.id, a]));
    for (const a of imported) byId.set(a.id, a);
    merged = [...byId.values()];
  }

  await writeArtifacts(merged);
  return NextResponse.json({ count: imported.length, total: merged.length });
}

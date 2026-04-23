import Link from 'next/link';
import { notFound } from 'next/navigation';
import { readArtifacts } from '@/lib/artifacts-server';
import { readUploads } from '@/lib/uploads-server';
import { Plate } from '@/components/Plate';
import { ArchiveInlineEdit } from '@/components/ArchiveInlineEdit';
import { pad } from '@/lib/kinds';
import type { Artifact } from '@/types/artifact';

export const dynamic = 'force-dynamic';

function buildUnclassified(artifacts: Artifact[], uploads: Awaited<ReturnType<typeof readUploads>>): Artifact[] {
  const usedSrcs = new Set<string>();
  for (const a of artifacts) for (const img of a.images ?? []) usedSrcs.add(img.src);
  const seen = new Set<string>();
  const loose = uploads.filter((f) => {
    if (usedSrcs.has(f.src)) return false;
    const k = `${f.originalName}|${f.size}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
  const baseIndex = artifacts.length;
  return loose.map((f, i) => ({
    id: `U-${String(baseIndex + i + 1).padStart(3, '0')}`,
    catNo: f.originalName,
    title: f.originalName,
    year: new Date(f.uploadedAt).getFullYear() || new Date().getFullYear(),
    kind: 'UNCLASSIFIED',
    production: '—',
    material: '—',
    finish: '—',
    status: 'UNSORTED',
    dims: f.w && f.h ? `${f.w} × ${f.h} px` : '—',
    palette: ['#888888', '#aaaaaa', '#555555'],
    images: [{ src: f.src, thumb: f.thumb, w: f.w, h: f.h, alt: f.originalName }],
    index: baseIndex + i + 1,
  }));
}

export default async function ArchivePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [artifacts, uploads] = await Promise.all([readArtifacts(), readUploads()]);
  const unclassified = buildUnclassified(artifacts, uploads);
  const all = [...artifacts, ...unclassified];
  const sel = all.find((a) => a.id === id);
  if (!sel) notFound();

  const idx = all.findIndex((a) => a.id === sel.id);
  const prev = idx > 0 ? all[idx - 1] : null;
  const next = idx < all.length - 1 ? all[idx + 1] : null;
  const related = all
    .filter((a) => a.id !== sel.id && (a.production === sel.production || a.kind === sel.kind))
    .slice(0, 10);

  return (
    <div className="pw arch-view">
      <div className="arch-nav">
        <Link href="/">← Index</Link>
        <span className="arch-nav-rule" />
        <span className="arch-nav-id">{sel.catNo}</span>
        <span className="arch-nav-sp" />
        {prev ? <Link href={`/archive/${prev.id}`}>← Prev</Link> : <button disabled>← Prev</button>}
        <span className="arch-nav-pos">
          {pad(idx + 1, 2)} / {pad(all.length, 2)}
        </span>
        {next ? <Link href={`/archive/${next.id}`}>Next →</Link> : <button disabled>Next →</button>}
      </div>

      <div className="arch-split">
        <div className="arch-plate-wrap">
          <div className="arch-plate">
            <span className="arch-pc tl" />
            <span className="arch-pc tr" />
            <span className="arch-pc bl" />
            <span className="arch-pc br" />
            <Plate a={sel} fit="contain" size="full" priority />
          </div>
          <div className="arch-plate-foot">
            <span className="arch-pf-k">{sel.id}</span>
            <span className="arch-pf-sep">·</span>
            <span className="arch-pf-v">{sel.catNo}</span>
            <span className="arch-pf-sep">·</span>
            <span className="arch-pf-v">{sel.year}</span>
          </div>
        </div>

        <div className="arch-side">
          <ArchiveInlineEdit initial={sel} related={related} />
        </div>
      </div>
    </div>
  );
}

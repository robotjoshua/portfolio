import Link from 'next/link';
import { notFound } from 'next/navigation';
import { readArtifacts } from '@/lib/artifacts-server';
import { readUploads } from '@/lib/uploads-server';
import { synthesizeUnclaimed } from '@/lib/combined-artifacts';
import { Plate } from '@/components/Plate';
import { ArchiveInlineEdit } from '@/components/ArchiveInlineEdit';
import { ArchiveBackButton } from '@/components/ArchiveBackButton';
import { pad } from '@/lib/kinds';
import { isAdminServer } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function ArchivePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [artifacts, uploads, isAdmin] = await Promise.all([readArtifacts(), readUploads(), isAdminServer()]);
  // Share the same U-* id generation as /catalog so IDs resolve consistently
  // when a user clicks a tile over there.
  const unclassified = synthesizeUnclaimed(artifacts, uploads);
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
        <Link href="/catalog">← Catalog</Link>
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
        <ArchiveBackButton />
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
          <ArchiveInlineEdit initial={sel} related={related} readOnly={!isAdmin} />
        </div>
      </div>
    </div>
  );
}

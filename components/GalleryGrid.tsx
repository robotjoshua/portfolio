import Link from 'next/link';
import type { Artifact } from '@/types/artifact';
import { Plate } from './Plate';
import { KS } from '@/lib/kinds';

// Japanese-kanji shorthand for kinds — used as hanko-style corner stamps.
const KIND_KANJI: Record<string, string> = {
  WEAPON: '武',
  ARMOR: '甲',
  TECH: '機',
  'SET-DRESS': '具',
  HERO: '主',
  GRAPHIC: '図',
};

// show the artifact id on the slug line rather than a messy filename/extension
function slugLabel(a: Artifact): string {
  const c = (a.catNo || '').trim();
  if (!c || /\.(jpe?g|png|webp|gif|tiff?)$/i.test(c)) return a.id;
  return c.length > 22 ? a.id : c;
}

export function GalleryGrid({ artifacts, total }: { artifacts: Artifact[]; total?: number }) {
  void total;
  return (
    <div className="gm-wrap">
      <div className="gm-grid">
        {artifacts.map((a, i) => {
          const isCover = i === 0;
          const kanji = KIND_KANJI[a.kind?.toUpperCase?.() ?? ''] ?? '◆';
          const slug = slugLabel(a);
          return (
            <Link
              key={a.id}
              href={`/archive/${a.id}`}
              className="gm-c"
              style={{ animationDelay: i * 14 + 'ms' }}
              aria-label={`${slug} · ${a.title}`}
            >
              <div className="gm-plate">
                <Plate a={a} />
              </div>
              {/* cover tile gets a hanko kind-stamp */}
              {isCover && (
                <span className="gm-hanko" aria-hidden>
                  {kanji}
                </span>
              )}
              {/* slug strip — always visible catalog line */}
              <span className="gm-slug">
                <span className="gm-slug-k">
                  <span className="gm-slug-sym">{KS[a.kind as keyof typeof KS] ?? '◆'}</span>
                  {slug}
                </span>
              </span>
              {/* hover reveal */}
              <span className="gm-over">
                <span className="gm-over-t">{a.title}</span>
                {a.material && <span className="gm-over-m">{a.material}</span>}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

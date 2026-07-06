import Link from 'next/link';
import type { ReactNode } from 'react';

type SideLink = { label: string; href: string; dir?: 'prev' | 'next' };

const KANA: Record<string, string> = {
  INDEX: 'インデックス',
  CATALOG: 'カタログ',
  RECORD: 'レコード',
  OPERATOR: 'オペレーター',
  ARCHIVE: 'アーカイブ',
};

const KANJI: Record<string, string> = {
  INDEX: '索引',
  CATALOG: '目録',
  RECORD: '記録',
  OPERATOR: '作者',
  ARCHIVE: '保管',
};

const HANKO: Record<string, string> = {
  INDEX: '索',
  CATALOG: '録',
  RECORD: '記',
  OPERATOR: '認',
  ARCHIVE: '蔵',
};

export function ViewerFrame({
  meta,
  date,
  currentLabel,
  prev,
  next,
  children,
}: {
  /** Top-right meta, e.g. "313 / 313" */
  meta?: string;
  /** ISO date shown at the foot of the rail */
  date?: string;
  /** Bottom-center label */
  currentLabel: string;
  /** Bottom-left prev link */
  prev?: SideLink;
  /** Bottom-right next links */
  next?: SideLink[];
  children: ReactNode;
}) {
  const key = currentLabel.toUpperCase();
  const kana = KANA[key] ?? '';
  const kanji = KANJI[key] ?? '';
  const hanko = HANKO[key] ?? '◆';
  return (
    <div className="pw vf-wrap">
      <div className="vf-top">
        {prev ? (
          <Link href={prev.href} className="vf-link">
            ← {prev.label}
          </Link>
        ) : (
          <span className="vf-link-disabled">←</span>
        )}
        <span className="vf-rule" />
        <span className="vf-pos">
          <b>{currentLabel}</b>
          {kana && <i>{kana}</i>}
        </span>
        <span className="vf-rule" />
        {(next ?? []).map((n, i) => (
          <span key={n.href} className="vf-next-link">
            {i > 0 && <span className="vf-dot">·</span>}
            <Link href={n.href} className="vf-link">
              {n.label} →
            </Link>
          </span>
        ))}
        {meta && (
          <>
            <span className="vf-rule" />
            <span className="vf-meta vf-meta-top">{meta}</span>
          </>
        )}
      </div>
      <div className="vf-left">
        <span className="vf-rail-rule" aria-hidden />
        <span className="vf-hanko round" aria-hidden>{hanko}</span>
        <span className="vf-rail-kana">{kanji}</span>
        <span className="vf-rail-txt">{date || currentLabel}</span>
      </div>
      <div className="vf-viewer">
        <span className="vf-tick tl" aria-hidden />
        <span className="vf-tick bl" aria-hidden />
        {children}
      </div>
    </div>
  );
}

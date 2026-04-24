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
  tag,
  title,
  meta,
  leftRail,
  rightRail,
  currentLabel,
  prev,
  next,
  children,
}: {
  /** Top-left badge, e.g. "◆ Build Archive" */
  tag: string;
  /** Top-center title, e.g. "CATALOG · ALL KINDS" */
  title: string;
  /** Top-right meta, e.g. "313 / 313" */
  meta?: string;
  /** Left vertical rail text parts (joined by · dots) */
  leftRail?: string[];
  /** Right vertical rail text parts */
  rightRail?: string[];
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
  const dateStr = (leftRail ?? rightRail ?? []).find((p) => /^\d{4}-\d{2}-\d{2}$/.test(p)) ?? '';
  const leftExtras = (leftRail ?? []).filter((p) => p !== dateStr);
  const rightExtras = (rightRail ?? []).filter((p) => p !== dateStr);
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
        <span className="vf-rail-mk"><b>◤</b></span>
        <span className="vf-rail-kana">
          {kanji}
          {leftExtras.length > 0 && <i> · {leftExtras.join(' · ')}</i>}
        </span>
        <span className="vf-rail-txt">{dateStr || currentLabel}</span>
      </div>
      <div className="vf-right">
        <span className="vf-rail-rule" aria-hidden />
        <span className="vf-hanko round" aria-hidden>{hanko}</span>
        <span className="vf-rail-kana">
          {kana}
          {rightExtras.length > 0 && <i> · {rightExtras.join(' · ')}</i>}
        </span>
        <span className="vf-rail-txt">{dateStr ? `REV ${dateStr.slice(2).replace(/-/g, '·')}` : 'LIVE'}</span>
      </div>
      <div className="vf-viewer">
        <span className="vf-tick tl" aria-hidden />
        <span className="vf-tick bl" aria-hidden />
        {children}
      </div>
      <div className="vf-bot">
        <span className="vf-tag">{tag}</span>
        <span className="vf-rule" />
        <span className="vf-title">{title}</span>
        <span className="vf-rule" />
        <span className="vf-bot-end" />
      </div>
    </div>
  );
}

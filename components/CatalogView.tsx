'use client';
import { useMemo, useState } from 'react';
import type { Artifact } from '@/types/artifact';
import { KS, pad } from '@/lib/kinds';
import { EvCell } from './EvCell';
import { ViewerFrame } from './ViewerFrame';
import { NumTicker } from './NumTicker';

export function CatalogView({ artifacts }: { artifacts: Artifact[] }) {
  const [q, setQ] = useState('');
  const [kind, setKind] = useState<string | null>(null);
  const [year, setYear] = useState<number | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const kindCounts = useMemo(() => {
    const c: Record<string, number> = {};
    artifacts.forEach((a) => (c[a.kind] = (c[a.kind] || 0) + 1));
    return c;
  }, [artifacts]);
  const yearCounts = useMemo(() => {
    const c: Record<string, number> = {};
    artifacts.forEach((a) => (c[a.year] = (c[a.year] || 0) + 1));
    return c;
  }, [artifacts]);
  const statusCounts = useMemo(() => {
    const c: Record<string, number> = {};
    artifacts.forEach((a) => (c[a.status] = (c[a.status] || 0) + 1));
    return c;
  }, [artifacts]);

  const filtered = useMemo(
    () =>
      artifacts.filter((a) => {
        if (kind && kind !== a.kind) return false;
        if (year && year !== a.year) return false;
        if (status && status !== a.status) return false;
        if (q) {
          const Q = q.toLowerCase();
          return [a.id, a.title, a.material, a.production, a.kind].some((v) =>
            String(v).toLowerCase().includes(Q),
          );
        }
        return true;
      }),
    [artifacts, q, kind, year, status],
  );
  const hasFilter = kind || year || status || q;

  const nowLabel = new Date().toISOString().slice(0, 10);

  return (
    <ViewerFrame
      tag="◆ Build Archive"
      title="CATALOG · ALL KINDS"
      meta={`${pad(filtered.length, 3)} / ${pad(artifacts.length, 3)}`}
      leftRail={['CATALOG', nowLabel]}
      rightRail={['LIVE', hasFilter ? 'FILTERED' : 'ALL']}
      currentLabel="CATALOG"
      prev={{ label: 'INDEX', href: '/' }}
      next={[
        { label: 'RECORD', href: '/record' },
        { label: 'OPERATOR', href: '/operator' },
      ]}
    >
      <div className="cat-board">
        <div className="cat-filter-row">
          <div className="cat-f-group">
            <span className="cat-f-label">Kind<i>カインド</i></span>
            <div className="cat-f-chips">
              {Object.entries(kindCounts).sort().map(([k, c]) => (
                <button
                  key={k}
                  className={`cat-chip${kind === k ? ' on' : ''}`}
                  onClick={() => setKind(kind === k ? null : k)}
                >
                  <span className="cat-chip-sym">{KS[k as keyof typeof KS]}</span>
                  <span>{k}</span>
                  <span className="cat-chip-c">{pad(c, 2)}</span>
                </button>
              ))}
            </div>
          </div>
          <span className="cat-f-divider" />
          <div className="cat-f-group">
            <span className="cat-f-label">Year<i>ネン</i></span>
            <div className="cat-f-chips">
              {Object.entries(yearCounts).sort().map(([y, c]) => (
                <button
                  key={y}
                  className={`cat-chip${year === +y ? ' on' : ''}`}
                  onClick={() => setYear(year === +y ? null : +y)}
                >
                  <span>{y}</span>
                  <span className="cat-chip-c">{pad(c, 2)}</span>
                </button>
              ))}
            </div>
          </div>
          <span className="cat-f-divider" />
          <div className="cat-f-group">
            <span className="cat-f-label">Status<i>ステータス</i></span>
            <div className="cat-f-chips">
              {Object.entries(statusCounts).sort().map(([s, c]) => (
                <button
                  key={s}
                  className={`cat-chip${status === s ? ' on' : ''}`}
                  onClick={() => setStatus(status === s ? null : s)}
                >
                  <span>{s}</span>
                  <span className="cat-chip-c">{pad(c, 2)}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="ev-grid">
          {filtered.map((a, i) => (
            <EvCell key={a.id} a={a} href={`/archive/${a.id}`} delay={i * 10} />
          ))}
        </div>
        <div className="cat-foot">
          <span className="cat-foot-stat">
            <span className="cat-foot-v">{pad(filtered.length, 3)}</span>
            <span className="cat-foot-k">/ {pad(artifacts.length, 3)} shown</span>
          </span>
          <input
            className="cat-foot-q"
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search…"
          />
          <span className="cat-foot-seq" aria-hidden>
            <span className="cat-foot-seq-k">
              <b>JP–SEQ</b>
              <i>整理番号</i>
            </span>
            <span className="cat-foot-seq-v">
              <NumTicker value={pad(filtered.length, 3)} />
              <span className="cat-foot-seq-sep">·</span>
              <NumTicker value={pad(artifacts.length, 3)} idle={false} />
              <span className="cat-foot-seq-sep">·</span>
              <span className="cat-foot-seq-tag">
                {(kind ?? 'A').slice(0, 3).toUpperCase().padEnd(3, 'X')}
              </span>
              <span className="cat-foot-seq-sep">·</span>
              <NumTicker value={year ? String(year).slice(-2) : '26'} idle={false} />
              <span className="cat-foot-seq-sep">·</span>
              <span className="cat-foot-seq-tag">
                {(status ?? 'ALL').slice(0, 3).toUpperCase().padEnd(3, 'X')}
              </span>
              <span className="cat-foot-seq-sep">·</span>
              <span className="cat-foot-seq-tag">{hasFilter ? 'FLT' : 'ALL'}</span>
              <span className="cat-foot-seq-sep">·</span>
              <NumTicker
                value={pad(Math.floor((filtered.length * 17) % 9999), 4)}
              />
            </span>
          </span>
          {hasFilter && (
            <button
              className="cat-foot-clear"
              onClick={() => {
                setKind(null);
                setYear(null);
                setStatus(null);
                setQ('');
              }}
            >
              Clear ✕
            </button>
          )}
        </div>
      </div>
    </ViewerFrame>
  );
}

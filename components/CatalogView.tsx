'use client';
import { useMemo, useState } from 'react';
import type { Artifact } from '@/types/artifact';
import { KS, pad } from '@/lib/kinds';
import { EvCell } from './EvCell';

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

  return (
    <div className="pw cat-wrap">
      <div className="cat-side">
        <div className="cs-sec">
          <div className="cs-h">
            <span>Kind</span>
            <span>{pad(Object.keys(kindCounts).length, 2)}</span>
          </div>
          {Object.entries(kindCounts)
            .sort()
            .map(([k, c]) => (
              <div
                key={k}
                className={`cs-item${kind === k ? ' on' : ''}`}
                onClick={() => setKind(kind === k ? null : k)}
              >
                <span>
                  <span className="cs-sym">{KS[k as keyof typeof KS]}</span>
                  {k}
                </span>
                <span className="cs-c">{pad(c, 2)}</span>
              </div>
            ))}
        </div>
        <div className="cs-sec">
          <div className="cs-h">
            <span>Year</span>
            <span>{pad(Object.keys(yearCounts).length, 2)}</span>
          </div>
          {Object.entries(yearCounts)
            .sort()
            .map(([y, c]) => (
              <div
                key={y}
                className={`cs-item${year === +y ? ' on' : ''}`}
                onClick={() => setYear(year === +y ? null : +y)}
              >
                <span>{y}</span>
                <span className="cs-c">{pad(c, 2)}</span>
              </div>
            ))}
        </div>
        <div className="cs-sec">
          <div className="cs-h">
            <span>Status</span>
            <span>{pad(Object.keys(statusCounts).length, 2)}</span>
          </div>
          {Object.entries(statusCounts)
            .sort()
            .map(([s, c]) => (
              <div
                key={s}
                className={`cs-item${status === s ? ' on' : ''}`}
                onClick={() => setStatus(status === s ? null : s)}
              >
                <span>{s}</span>
                <span className="cs-c">{pad(c, 2)}</span>
              </div>
            ))}
        </div>
        <div className="cs-stat">
          <span className="cs-stat-v">{pad(filtered.length, 3)}</span>
          <span className="cs-stat-k">/ {pad(artifacts.length, 3)} shown</span>
        </div>
        <input
          className="cs-q"
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search…"
        />
        {hasFilter && (
          <button
            className="cs-clear"
            onClick={() => {
              setKind(null);
              setYear(null);
              setStatus(null);
              setQ('');
            }}
          >
            Clear filters ✕
          </button>
        )}
      </div>
      <div className="cat-main">
        <div className="cat-topbar">
          <span className="ctb-l">Build Archive</span>
          <span>·</span>
          <span>{kind ? `${KS[kind as keyof typeof KS]} ${kind}` : 'All kinds'}</span>
          {year && (
            <>
              <span>·</span>
              <span>{year}</span>
            </>
          )}
          {status && (
            <>
              <span>·</span>
              <span>{status}</span>
            </>
          )}
          <span style={{ flex: 1 }} />
          <span>
            {pad(filtered.length, 3)} / {pad(artifacts.length, 3)}
          </span>
        </div>
        <div className="ev-grid">
          {filtered.map((a, i) => (
            <EvCell
              key={a.id}
              a={a}
              href={`/archive/${a.id}`}
              delay={i * 10}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

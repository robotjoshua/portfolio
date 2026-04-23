'use client';
import { Fragment } from 'react';
import { useRouter } from 'next/navigation';

const LINKS = [
  { label: 'Index', href: '/' },
  { label: 'Catalog', href: '/catalog' },
  { label: 'Record', href: '/record' },
  { label: 'Operator', href: '/operator' },
] as const;

export function TermBar() {
  const router = useRouter();
  return (
    <div className="term-bar">
      {LINKS.map((s, i) => (
        <Fragment key={s.label}>
          {i > 0 && <span className="tsep" />}
          <span
            onClick={() => router.push(s.href)}
            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
          >
            {s.label}
          </span>
        </Fragment>
      ))}
      <span className="tver">◈ JP-ARCHIVE v1.0 · {new Date().getFullYear()}</span>
    </div>
  );
}

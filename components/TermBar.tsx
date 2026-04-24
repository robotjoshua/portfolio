'use client';
import { Fragment, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const LINKS = [
  { label: 'Index', href: '/' },
  { label: 'Catalog', href: '/catalog' },
  { label: 'Record', href: '/record' },
  { label: 'Operator', href: '/operator' },
] as const;

export function TermBar() {
  const router = useRouter();
  const [ver, setVer] = useState('—.—');
  useEffect(() => {
    const major = Math.floor(Math.random() * 9) + 1;
    const minor = Math.floor(Math.random() * 90) + 10;
    const patch = Math.floor(Math.random() * 900) + 100;
    setVer(`v${major}.${minor}.${patch}`);
  }, []);
  return (
    <div className="term-bar">
      <span className="tver">◈ JP-ARCHIVE {ver} · {new Date().getFullYear()}</span>
      <span className="tlinks">
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
      </span>
    </div>
  );
}

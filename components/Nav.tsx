'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useDark } from './providers';
import { AmbientHum } from './AmbientHum';

export function Nav({ recLabel }: { recLabel?: string }) {
  const pathname = usePathname() ?? '/';
  const { dark, toggle } = useDark();
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const tabs: { id: string; href: string; label: string; match: (p: string) => boolean }[] = [
    { id: 'index', href: '/', label: 'Index', match: (p) => p === '/' },
    { id: 'catalog', href: '/catalog', label: 'Catalog', match: (p) => p.startsWith('/catalog') },
    {
      id: 'record',
      href: '/record',
      label: recLabel ? `Record · ${recLabel}` : 'Record',
      match: (p) => p.startsWith('/record'),
    },
    { id: 'operator', href: '/operator', label: 'Operator', match: (p) => p.startsWith('/operator') },
  ];

  return (
    <nav className="nav">
      <span className="nav-mark">◈</span>
      <span className="nav-id">Archive · JP</span>
      <span className="nav-sep" />
      <div className="nav-tabs">
        {tabs.map((t) => (
          <Link key={t.id} href={t.href} className={`nav-tab${t.match(pathname) ? ' on' : ''}`}>
            {t.label}
          </Link>
        ))}
      </div>
      <span className="nav-sp" />
      <span className="nav-utc">
        {now ? now.toISOString().replace('T', ' ').slice(0, 19) + 'Z' : '\u00a0'}
      </span>
      <AmbientHum />
      <button className="nav-theme" onClick={toggle}>
        {dark ? '◑ Light' : '◑ Dark'}
      </button>
      {process.env.NODE_ENV !== 'production' && (
        <Link href="/admin" className={`nav-admin${pathname.startsWith('/admin') ? ' on' : ''}`}>
          ▣ Admin
        </Link>
      )}
    </nav>
  );
}

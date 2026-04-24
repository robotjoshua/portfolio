'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useDark } from './providers';
import { AmbientHum } from './AmbientHum';
import { NavStrip } from './NavStrip';

export function Nav({ recLabel }: { recLabel?: string }) {
  const pathname = usePathname() ?? '/';
  const { dark, toggle } = useDark();
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  void recLabel;

  return (
    <>
      <nav className="nav">
        <span className="nav-mark">◈</span>
        <span className="nav-id">
          <b>Archive · JP</b>
          <i>アーカイブ</i>
        </span>
        <span className="nav-rev">
          <span className="nav-rev-k">REV</span>
          <span className="nav-rev-v">26·Ω·07</span>
        </span>
        <span className="nav-sp" />
        <span className="nav-utc">
          {now ? now.toISOString().replace('T', ' ').slice(0, 19) + 'Z' : '\u00a0'}
        </span>
        <AmbientHum />
        <button className="nav-theme" onClick={toggle}>
          {dark ? '◑ Light' : '◑ Dark'}
        </button>
        <Link href="/admin" className={`nav-admin${pathname.startsWith('/admin') ? ' on' : ''}`}>
          ▣ Admin
        </Link>
      </nav>
      <NavStrip />
    </>
  );
}

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
    const t = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  void recLabel;

  return (
    <>
      <nav className="nav">
        <span className="nav-mark">◈</span>
        <span className="nav-id">
          <b>Archive · JP</b>
        </span>
        <span className="nav-sp" />
        <span className="nav-utc">
          {now ? now.toISOString().replace('T', ' ').slice(0, 16) + 'Z' : '\u00a0'}
        </span>
        <AmbientHum />
        <button
          className="nav-icon nav-theme"
          onClick={toggle}
          aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
          title={dark ? 'Light mode' : 'Dark mode'}
        >
          ◑
        </button>
        <Link
          href="/admin"
          className={`nav-icon nav-admin${pathname.startsWith('/admin') ? ' on' : ''}`}
          aria-label="Admin"
          title="Admin"
        >
          ▣
        </Link>
      </nav>
    </>
  );
}

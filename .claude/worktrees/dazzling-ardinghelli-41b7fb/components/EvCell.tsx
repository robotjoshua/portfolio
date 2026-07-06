'use client';
import Link from 'next/link';
import type { Artifact } from '@/types/artifact';
import { KS } from '@/lib/kinds';
import { Plate } from './Plate';

export function EvCell({
  a,
  sel,
  href,
  delay = 0,
  onClick,
}: {
  a: Artifact;
  sel?: boolean;
  href?: string;
  delay?: number;
  onClick?: () => void;
}) {
  const inner = (
    <>
      <div className="ev-plate">
        <div className="ev-art">
          <Plate a={a} />
        </div>
      </div>
      <div className="ev-tag">
        <span className="ev-tag-id">{a.id}</span>
        <span>{KS[a.kind]}</span>
      </div>
    </>
  );
  const className = `ev-cell${sel ? ' sel' : ''}`;
  const style = { animationDelay: delay + 'ms' } as const;
  if (href) {
    const external = !href.startsWith('/archive/');
    if (external) {
      return (
        <a href={href} target="_blank" rel="noreferrer" className={className} style={style}>
          {inner}
        </a>
      );
    }
    return (
      <Link href={href} className={className} style={style}>
        {inner}
      </Link>
    );
  }
  return (
    <div className={className} style={style} onClick={onClick}>
      {inner}
    </div>
  );
}

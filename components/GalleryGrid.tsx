import Link from 'next/link';
import type { Artifact } from '@/types/artifact';
import { Plate } from './Plate';

export function GalleryGrid({ artifacts }: { artifacts: Artifact[] }) {
  return (
    <div className="gal-wrap">
      <div className="gal-grid">
        {artifacts.map((a, i) => (
          <Link
            key={a.id}
            href={`/archive/${a.id}`}
            className="gal-c"
            style={{ animationDelay: i * 10 + 'ms', animation: 'evi .4s cubic-bezier(.2,.7,.2,1) both' }}
          >
            <div style={{ position: 'absolute', inset: 0 }}>
              <Plate a={a} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

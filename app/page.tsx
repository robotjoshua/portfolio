import Link from 'next/link';
import { readArtifacts } from '@/lib/artifacts-server';
import { GalleryGrid } from '@/components/GalleryGrid';
import { NumScramble } from '@/components/NumScramble';
import { TelemetryPanel } from '@/components/TelemetryPanel';
import { Rain8Bit } from '@/components/Rain8Bit';
import { readProfile } from '@/lib/profile-server';
import { pad } from '@/lib/kinds';

export default async function IndexPage() {
  const [artifacts, profile] = await Promise.all([readArtifacts(), readProfile()]);
  const BUILD = profile.build;
  const NAME_PARTS = profile.identity.name.split(' ');
  const FIRST = NAME_PARTS[0] ?? profile.identity.name;
  const LAST = NAME_PARTS.slice(1).join(' ');

  return (
    <div className="pw idx-wrap">
      <div className="idx-left">
        <div style={{ paddingBottom: 14, borderBottom: '1px solid var(--rule)', marginBottom: 14 }}>
          <div
            style={{
              fontFamily: 'var(--f-m)',
              fontSize: 8,
              letterSpacing: '.2em',
              textTransform: 'uppercase',
              color: 'var(--muted)',
              marginBottom: 9,
            }}
          >
            {profile.identity.callsign}
          </div>
          <div className="idx-name">
            {FIRST}
            {LAST ? <><br />{LAST}</> : null}
          </div>
          <div
            style={{
              fontFamily: 'var(--f-m)',
              fontSize: 9,
              letterSpacing: '.14em',
              textTransform: 'uppercase',
              color: 'var(--muted)',
              marginTop: 10,
            }}
          >
            {profile.identity.role}
          </div>
        </div>
        <TelemetryPanel />
        <Rain8Bit />
        <div style={{ marginTop: 'auto', paddingTop: 14, borderTop: '1px solid var(--rule)' }}>
          <div
            style={{
              fontFamily: 'var(--f-m)',
              fontSize: 8,
              letterSpacing: '.16em',
              textTransform: 'uppercase',
              color: 'var(--muted)',
              marginBottom: 8,
              display: 'flex',
              justifyContent: 'space-between',
            }}
          >
            <span>Active Build</span>
            <span className="d-live">● Live</span>
          </div>
          <div
            style={{
              fontFamily: 'var(--f-m)',
              fontSize: 8,
              letterSpacing: '.1em',
              color: 'var(--muted)',
              textTransform: 'uppercase',
              marginBottom: 3,
            }}
          >
            {BUILD.production}
          </div>
          <div
            style={{
              fontFamily: 'var(--f-d)',
              fontWeight: 500,
              fontSize: 14,
              letterSpacing: '-.02em',
              marginBottom: 9,
            }}
          >
            {BUILD.prop}
          </div>
          <div className="d-segs" style={{ marginBottom: 8 }}>
            {BUILD.phases.map((p, i) => (
              <div
                key={p}
                className={`d-seg${
                  i < BUILD.currentPhase ? ' done' : i === BUILD.currentPhase ? ' act' : ' todo'
                }`}
              >
                {p}
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span
              style={{
                fontFamily: 'var(--f-m)',
                fontSize: 8,
                letterSpacing: '.1em',
                textTransform: 'uppercase',
                color: 'var(--muted)',
              }}
            >
              Due · {BUILD.due}
            </span>
          </div>
        </div>
      </div>
      <div className="idx-right">
        <div className="gal-hdr">
          <span>Featured · Prop Catalog</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span className="gal-scroll-hint">Scroll ↓</span>
            <Link href="/catalog" className="chip" style={{ padding: '3px 10px', fontSize: 9 }}>
              Browse all <NumScramble value={pad(artifacts.length)} durationMs={500} /> →
            </Link>
          </div>
        </div>
        <GalleryGrid artifacts={artifacts.slice(0, 20)} />
      </div>
    </div>
  );
}

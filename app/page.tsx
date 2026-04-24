import Link from 'next/link';
import { readArtifacts } from '@/lib/artifacts-server';
import { GalleryGrid } from '@/components/GalleryGrid';
import { NumScramble } from '@/components/NumScramble';
import { ViewerFrame } from '@/components/ViewerFrame';
import { readProfile } from '@/lib/profile-server';
import { pad } from '@/lib/kinds';

export const dynamic = 'force-dynamic';

export default async function IndexPage() {
  const [artifacts, profile] = await Promise.all([readArtifacts(), readProfile()]);
  const BUILD = profile.build;
  const NAME_PARTS = profile.identity.name.split(' ');
  const FIRST = NAME_PARTS[0] ?? profile.identity.name;
  const LAST = NAME_PARTS.slice(1).join(' ');

  const nowLabel = new Date().toISOString().slice(0, 10);
  const artifactCount = artifacts.length;
  const creditCount = (profile.cv ?? []).length;
  const recordChapters = 8;

  return (
    <ViewerFrame
      tag={`◆ ${profile.identity.callsign}`}
      title="INDEX · OPERATOR PROFILE"
      meta={`${pad(artifactCount, 3)} ARTIFACTS`}
      leftRail={['INDEX', nowLabel]}
      rightRail={['LIVE', BUILD.production]}
      currentLabel="INDEX"
      next={[
        { label: 'CATALOG', href: '/catalog' },
        { label: 'RECORD', href: '/record' },
        { label: 'OPERATOR', href: '/operator' },
      ]}
    >
      <div className="idx-wrap idx-wrap-inner">
        <div className="idx-left">
          {/* MASTHEAD */}
          <div className="idx-mast">
            <div className="idx-mast-tag">
              <span>{profile.identity.callsign}</span>
              {profile.identity.locationShort && (
                <>
                  <span className="idx-mast-dot">·</span>
                  <span>{profile.identity.locationShort}</span>
                </>
              )}
            </div>
            <div className="idx-name">
              {FIRST}
              {LAST ? (
                <>
                  <br />
                  {LAST}
                </>
              ) : null}
            </div>
            <div className="idx-mast-role">{profile.identity.role}</div>
            {profile.identity.available && (
              <div className="idx-mast-avail">
                <span className="idx-mast-avail-d" />
                Available for commission
              </div>
            )}
          </div>

          {/* LEDE */}
          <p className="idx-lede">{profile.identity.bio}</p>

          {/* IN THE SHOP */}
          <section className="idx-sec">
            <header className="idx-sec-h">
              <span className="idx-sec-i">◎</span>
              <span>
                <b>In the Shop</b>
                <i>作業中</i>
              </span>
              <span className="idx-sec-live">● LIVE</span>
            </header>
            <div className="idx-shop">
              <div className="idx-shop-prod">{BUILD.production}</div>
              <div className="idx-shop-prop">{BUILD.prop}</div>
              <div className="idx-shop-meta">
                <span>Due · {BUILD.due}</span>
                <span>
                  Phase {pad((BUILD.currentPhase ?? 0) + 1, 2)}/{pad(BUILD.phases.length, 2)}
                </span>
              </div>
              <div className="idx-shop-bar" aria-hidden>
                <span style={{ width: `${Math.max(0, Math.min(100, BUILD.pct ?? 0))}%` }} />
              </div>
              <div className="idx-shop-pct">{pad(BUILD.pct ?? 0, 2)}%</div>
            </div>
          </section>

          {/* DIRECTORY */}
          <section className="idx-sec">
            <header className="idx-sec-h">
              <span className="idx-sec-i">◇</span>
              <span>
                <b>Directory</b>
                <i>目次</i>
              </span>
            </header>
            <nav className="idx-dir">
              <Link href="/catalog" className="idx-dir-row">
                <span className="idx-dir-n">I.</span>
                <span className="idx-dir-k">Catalog</span>
                <span className="idx-dir-sep" />
                <span className="idx-dir-v">
                  <NumScramble value={pad(artifactCount, 3)} durationMs={500} /> Props
                </span>
                <span className="idx-dir-arr">→</span>
              </Link>
              <Link href="/record" className="idx-dir-row">
                <span className="idx-dir-n">II.</span>
                <span className="idx-dir-k">Record</span>
                <span className="idx-dir-sep" />
                <span className="idx-dir-v">CH.01–{pad(recordChapters, 2)} Scan</span>
                <span className="idx-dir-arr">→</span>
              </Link>
              <Link href="/operator" className="idx-dir-row">
                <span className="idx-dir-n">III.</span>
                <span className="idx-dir-k">Operator</span>
                <span className="idx-dir-sep" />
                <span className="idx-dir-v">
                  <NumScramble value={pad(creditCount, 2)} durationMs={500} /> Credits
                </span>
                <span className="idx-dir-arr">→</span>
              </Link>
            </nav>
          </section>

        </div>

        {/* CONTACT RAIL — links through to the Operator page */}
        <Link className="idx-contact-rail" href="/operator" aria-label="Operator">
          <span className="idx-contact-rail-k">
            <span className="idx-contact-rail-sym">▣</span>
            Contact · 連絡
          </span>
          <span className="idx-contact-rail-arr">→</span>
        </Link>

        {/* RIGHT — FEATURED MOSAIC */}
        <div className="idx-right">
          <GalleryGrid
            artifacts={artifacts.filter((a) => a.showOnIndex !== false)}
            total={artifactCount}
          />
        </div>
      </div>
    </ViewerFrame>
  );
}

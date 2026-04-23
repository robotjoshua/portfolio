import { readProfile } from '@/lib/profile-server';

export const dynamic = 'force-dynamic';

export default async function OperatorPage() {
  const profile = await readProfile();
  const { identity, skills, cv } = profile;
  const parts = identity.name.split(' ');
  const first = parts[0] ?? identity.name;
  const last = parts.slice(1).join(' ');
  return (
    <div className="pw">
      <div className="sh">
        <span className="sl">Operator File</span>
        <span className="sc">{identity.callsign.split(' · ').slice(0, 2).join('-')}</span>
      </div>
      <div className="op-grid">
        <div className="op-panel">
          <div className="op-h">Skills &amp; Tools</div>
          {skills.map((g) => (
            <div key={g.cat} className="sk-group">
              <div className="sk-cat">
                <span>{g.cat}</span>
                <span className="sk-cat-n">{g.items.length.toString().padStart(2, '0')}</span>
              </div>
              <div className="sk-list">
                {g.items.map((s) => (
                  <div key={s.k} className="sk-row">
                    <span className="sk-name">{s.k}</span>
                    <div className="sk-bar" aria-label={`${s.v}%`}>
                      <div className="sk-bar-f" style={{ width: `${Math.max(0, Math.min(100, s.v))}%` }} />
                    </div>
                    <span className="sk-t">{s.t}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="op-panel">
          <div className="op-h">Credits &amp; Events</div>
          {cv.map((r, i) => (
            <div key={i} className="cv-row">
              <span className="cv-yr">{r.yr}</span>
              <div>
                <div className="cv-t">{r.t}</div>
                <div className="cv-s">{r.s}</div>
              </div>
            </div>
          ))}
          <div style={{ marginTop: 14 }}>
            <button className="chip">Full credits →</button>
          </div>
        </div>
        <div className="op-panel">
          <div className="op-h">Contact</div>
          <div className="op-name">
            {first}
            {last ? <><br />{last}</> : null}
          </div>
          <div className="op-email">{identity.email}</div>
          <div className="op-meta">
            {identity.addressLine}
            <br />
            {identity.hours}
            <br />
            {identity.handle}
          </div>
          <div style={{ marginTop: 20, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <a className="pill a" href={`mailto:${identity.email}`}>Get in touch →</a>
            {identity.available && (
              <button className="pill">
                <span className="d" />
                Available
              </button>
            )}
          </div>
          <div
            style={{
              marginTop: 16,
              fontFamily: 'var(--f-m)',
              fontSize: 10,
              lineHeight: 1.7,
              color: 'var(--muted)',
              whiteSpace: 'pre-line',
            }}
          >
            {identity.bio}
          </div>
        </div>
      </div>
    </div>
  );
}

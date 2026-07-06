'use client';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import type { Profile, SkillGroup, SkillItem, CvRow } from '@/types/profile';

type Tab = 'identity' | 'build' | 'skills' | 'cv';

export function ProfileForm({ initial }: { initial: Profile }) {
  const router = useRouter();
  const [p, setP] = useState<Profile>(initial);
  const [tab, setTab] = useState<Tab>('identity');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  const setId = <K extends keyof Profile['identity']>(k: K, v: Profile['identity'][K]) =>
    setP((prev) => ({ ...prev, identity: { ...prev.identity, [k]: v } }));

  const setBuild = <K extends keyof Profile['build']>(k: K, v: Profile['build'][K]) =>
    setP((prev) => ({ ...prev, build: { ...prev.build, [k]: v } }));

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    setOk(false);
    const res = await fetch('/api/admin/profile', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(p),
    });
    setBusy(false);
    if (!res.ok) {
      setErr(`${res.status} ${await res.text()}`);
      return;
    }
    setOk(true);
    router.refresh();
    setTimeout(() => setOk(false), 2000);
  }

  // skill group helpers
  const updateSkillGroup = (i: number, upd: (g: SkillGroup) => SkillGroup) =>
    setP((prev) => ({ ...prev, skills: prev.skills.map((g, idx) => (idx === i ? upd(g) : g)) }));

  const updateSkillItem = (gi: number, ii: number, upd: (it: SkillItem) => SkillItem) =>
    updateSkillGroup(gi, (g) => ({ ...g, items: g.items.map((it, idx) => (idx === ii ? upd(it) : it)) }));

  const addSkillItem = (gi: number) =>
    updateSkillGroup(gi, (g) => ({ ...g, items: [...g.items, { k: '', v: 50, t: '' }] }));

  const removeSkillItem = (gi: number, ii: number) =>
    updateSkillGroup(gi, (g) => ({ ...g, items: g.items.filter((_, idx) => idx !== ii) }));

  const addSkillGroup = () =>
    setP((prev) => ({ ...prev, skills: [...prev.skills, { cat: 'NEW', items: [] }] }));

  const removeSkillGroup = (i: number) =>
    setP((prev) => ({ ...prev, skills: prev.skills.filter((_, idx) => idx !== i) }));

  // cv helpers
  const updateCv = (i: number, upd: (r: CvRow) => CvRow) =>
    setP((prev) => ({ ...prev, cv: prev.cv.map((r, idx) => (idx === i ? upd(r) : r)) }));

  const addCv = () =>
    setP((prev) => ({ ...prev, cv: [{ yr: String(new Date().getFullYear()), t: '', s: '' }, ...prev.cv] }));

  const removeCv = (i: number) =>
    setP((prev) => ({ ...prev, cv: prev.cv.filter((_, idx) => idx !== i) }));

  return (
    <form onSubmit={onSubmit}>
      <div className="pf-tabs">
        {(['identity', 'build', 'skills', 'cv'] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`pf-tab${tab === t ? ' on' : ''}`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'identity' && (
        <div className="adm-form">
          <label>Name</label>
          <input value={p.identity.name} onChange={(e) => setId('name', e.target.value)} required />

          <label>Role</label>
          <input value={p.identity.role} onChange={(e) => setId('role', e.target.value)} required />

          <label>Callsign</label>
          <input value={p.identity.callsign} onChange={(e) => setId('callsign', e.target.value)} />

          <label>Location (short)</label>
          <input
            value={p.identity.locationShort}
            onChange={(e) => setId('locationShort', e.target.value)}
          />

          <label>Address Line</label>
          <input
            value={p.identity.addressLine}
            onChange={(e) => setId('addressLine', e.target.value)}
          />

          <label>Hours</label>
          <input value={p.identity.hours} onChange={(e) => setId('hours', e.target.value)} />

          <label>Email</label>
          <input
            type="email"
            value={p.identity.email}
            onChange={(e) => setId('email', e.target.value)}
          />

          <label>Handle</label>
          <input value={p.identity.handle} onChange={(e) => setId('handle', e.target.value)} />

          <label>Bio</label>
          <textarea value={p.identity.bio} onChange={(e) => setId('bio', e.target.value)} />

          <label>Available</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <input
              type="checkbox"
              checked={p.identity.available}
              onChange={(e) => setId('available', e.target.checked)}
              style={{ width: 'auto' }}
            />
            <span style={{ fontSize: 11, color: 'var(--muted)' }}>
              Shows &quot;Available&quot; badge on contact
            </span>
          </div>
        </div>
      )}

      {tab === 'build' && (
        <div className="adm-form">
          <label>Production</label>
          <input
            value={p.build.production}
            onChange={(e) => setBuild('production', e.target.value)}
          />

          <label>Prop</label>
          <input value={p.build.prop} onChange={(e) => setBuild('prop', e.target.value)} />

          <label>Phases (comma-sep)</label>
          <input
            value={p.build.phases.join(', ')}
            onChange={(e) =>
              setBuild(
                'phases',
                e.target.value
                  .split(',')
                  .map((s) => s.trim())
                  .filter(Boolean),
              )
            }
          />

          <label>Current Phase (0-idx)</label>
          <input
            type="number"
            min={0}
            max={Math.max(0, p.build.phases.length - 1)}
            value={p.build.currentPhase}
            onChange={(e) => setBuild('currentPhase', Number(e.target.value))}
          />

          <label>Percent (0–100)</label>
          <input
            type="number"
            min={0}
            max={100}
            value={p.build.pct}
            onChange={(e) => setBuild('pct', Number(e.target.value))}
          />

          <label>Due Date</label>
          <input
            type="date"
            value={p.build.due}
            onChange={(e) => setBuild('due', e.target.value)}
          />
        </div>
      )}

      {tab === 'skills' && (
        <div>
          {p.skills.map((g, gi) => (
            <div key={gi} className="pf-block">
              <div className="pf-block-h">
                <input
                  value={g.cat}
                  onChange={(e) => updateSkillGroup(gi, (grp) => ({ ...grp, cat: e.target.value }))}
                  style={{ fontFamily: 'var(--f-m)', letterSpacing: '.12em', textTransform: 'uppercase' }}
                />
                <button type="button" className="adm-btn ghost" onClick={() => removeSkillGroup(gi)}>
                  Remove group
                </button>
              </div>
              {g.items.map((it, ii) => (
                <div key={ii} className="pf-row">
                  <input
                    placeholder="Skill name"
                    value={it.k}
                    onChange={(e) => updateSkillItem(gi, ii, (x) => ({ ...x, k: e.target.value }))}
                    style={{ flex: 2 }}
                  />
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={it.v}
                    onChange={(e) =>
                      updateSkillItem(gi, ii, (x) => ({ ...x, v: Number(e.target.value) }))
                    }
                    style={{ width: 70 }}
                  />
                  <input
                    placeholder="14Y"
                    value={it.t}
                    onChange={(e) => updateSkillItem(gi, ii, (x) => ({ ...x, t: e.target.value }))}
                    style={{ width: 70 }}
                  />
                  <button
                    type="button"
                    className="adm-btn ghost"
                    onClick={() => removeSkillItem(gi, ii)}
                  >
                    ×
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="adm-btn ghost"
                onClick={() => addSkillItem(gi)}
                style={{ marginTop: 8 }}
              >
                + Add skill
              </button>
            </div>
          ))}
          <button type="button" className="adm-btn" onClick={addSkillGroup}>
            + Add group
          </button>
        </div>
      )}

      {tab === 'cv' && (
        <div>
          <button type="button" className="adm-btn" onClick={addCv} style={{ marginBottom: 12 }}>
            + Add entry
          </button>
          {p.cv.map((r, i) => (
            <div key={i} className="pf-row">
              <input
                placeholder="2026"
                value={r.yr}
                onChange={(e) => updateCv(i, (row) => ({ ...row, yr: e.target.value }))}
                style={{ width: 80 }}
              />
              <input
                placeholder="Title"
                value={r.t}
                onChange={(e) => updateCv(i, (row) => ({ ...row, t: e.target.value }))}
                style={{ flex: 2 }}
              />
              <input
                placeholder="Subtitle"
                value={r.s}
                onChange={(e) => updateCv(i, (row) => ({ ...row, s: e.target.value }))}
                style={{ flex: 2 }}
              />
              <button type="button" className="adm-btn ghost" onClick={() => removeCv(i)}>
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {err && (
        <div
          style={{
            padding: 12,
            background: '#b14a36',
            color: 'white',
            marginTop: 14,
            fontFamily: 'var(--f-m)',
            fontSize: 11,
            borderRadius: 6,
          }}
        >
          {err}
        </div>
      )}

      <div className="adm-actions">
        <button type="submit" className="adm-btn" disabled={busy}>
          {busy ? 'Saving…' : ok ? 'Saved ✓' : 'Save profile'}
        </button>
        <button type="button" className="adm-btn ghost" onClick={() => router.push('/admin')}>
          Back
        </button>
      </div>
    </form>
  );
}

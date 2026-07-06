import 'server-only';
import { eq, sql } from 'drizzle-orm';
import { getDb, schema } from './db/client';
import type { Profile } from '@/types/profile';

const FALLBACK: Profile = {
  identity: {
    name: 'Joshua Powell',
    role: 'Prop Fabricator',
    callsign: 'JP · 000 · Brooklyn NY',
    locationShort: 'Brooklyn NY',
    addressLine: 'Brooklyn · NY 11222',
    hours: 'Mon—Fri · 09:00—17:00 EST',
    email: 'studio@joshuapowell.art',
    handle: '@joshuapowell',
    bio: 'Film & TV commissions, convention & trade show design welcome.',
    available: true,
  },
  build: {
    production: 'Horizon Protocol · S2',
    prop: 'Hero Blaster Mk.II',
    phases: ['SCULPT', 'MOLD', 'CAST', 'PAINT', 'FINISH'],
    currentPhase: 4,
    pct: 84,
    due: '2026-05-12',
  },
  skills: [],
  cv: [],
};

export async function readProfile(): Promise<Profile> {
  try {
    const db = getDb();
    const rows = await db.select().from(schema.profile).where(eq(schema.profile.id, 1)).limit(1);
    if (rows[0]) return rows[0].data as Profile;
    return FALLBACK;
  } catch {
    return FALLBACK;
  }
}

export async function writeProfile(p: Profile): Promise<void> {
  const db = getDb();
  await db.insert(schema.profile)
    .values({ id: 1, data: p })
    .onConflictDoUpdate({
      target: schema.profile.id,
      set: { data: p, updatedAt: sql`now()` },
    });
}

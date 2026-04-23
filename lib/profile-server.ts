import 'server-only';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { Profile } from '@/types/profile';

const DATA_FILE = path.join(process.cwd(), 'data', 'profile.json');

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
    const raw = await fs.readFile(DATA_FILE, 'utf8');
    return JSON.parse(raw) as Profile;
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return FALLBACK;
    throw err;
  }
}

export async function writeProfile(p: Profile): Promise<void> {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(p, null, 2) + '\n', 'utf8');
}

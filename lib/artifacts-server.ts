import 'server-only';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { Artifact } from '@/types/artifact';

const DATA_FILE = path.join(process.cwd(), 'data', 'artifacts.json');

export async function readArtifacts(): Promise<Artifact[]> {
  try {
    const raw = await fs.readFile(DATA_FILE, 'utf8');
    const parsed = JSON.parse(raw) as Artifact[];
    return parsed.slice().sort((a, b) => a.index - b.index);
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return [];
    throw err;
  }
}

export async function writeArtifacts(list: Artifact[]): Promise<void> {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  const sorted = list.slice().sort((a, b) => a.index - b.index);
  await fs.writeFile(DATA_FILE, JSON.stringify(sorted, null, 2) + '\n', 'utf8');
}

export async function getArtifact(id: string): Promise<Artifact | null> {
  const all = await readArtifacts();
  return all.find((a) => a.id === id) ?? null;
}

export async function nextArtifactId(): Promise<{ id: string; index: number }> {
  const all = await readArtifacts();
  const maxIdx = all.reduce((m, a) => Math.max(m, a.index), 0);
  const index = maxIdx + 1;
  return { id: `JP-${String(index).padStart(3, '0')}`, index };
}

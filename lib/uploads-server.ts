import 'server-only';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { UploadedFile } from '@/types/upload';

const DATA_FILE = path.join(process.cwd(), 'data', 'uploads.json');

export async function readUploads(): Promise<UploadedFile[]> {
  try {
    const raw = await fs.readFile(DATA_FILE, 'utf8');
    const parsed = JSON.parse(raw) as UploadedFile[];
    return parsed.slice().sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return [];
    throw err;
  }
}

export async function writeUploads(list: UploadedFile[]): Promise<void> {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(list, null, 2) + '\n', 'utf8');
}

export async function appendUpload(file: UploadedFile): Promise<void> {
  const all = await readUploads();
  all.push(file);
  await writeUploads(all);
}

export async function removeUpload(filename: string): Promise<UploadedFile | null> {
  const all = await readUploads();
  const idx = all.findIndex((f) => f.filename === filename);
  if (idx === -1) return null;
  const [removed] = all.splice(idx, 1);
  await writeUploads(all);
  return removed;
}

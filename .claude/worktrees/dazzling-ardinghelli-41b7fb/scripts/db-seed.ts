// Idempotent seed: JSON -> Postgres, public/uploads + public/artifacts -> Blobs.
// Run once after provisioning Neon. Re-runs are safe (upserts + overwrites).
//
// Requires env:
//   DATABASE_URL                      Neon connection string
//   NETLIFY_SITE_ID + NETLIFY_TOKEN   (optional) seed real Netlify Blobs; otherwise writes to ./.blobs/
//
// Usage:
//   npm run db:push   # create tables
//   npm run db:seed

import { config as loadEnv } from 'dotenv';
loadEnv({ path: '.env.local' });
loadEnv({ path: '.env' });

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { getDb } from '../lib/db/client';
import { artifacts as artifactsTable, uploads as uploadsTable, profile as profileTable } from '../lib/db/schema';
import { putImage } from '../lib/blobs';

const root = process.cwd();

type ImageObj = { src: string; thumb?: string; w?: number; h?: number; alt?: string; caption?: string };
type ArtifactJson = {
  id: string;
  index?: number;
  catNo?: string;
  title?: string;
  year?: number;
  kind?: string;
  production?: string;
  material?: string;
  finish?: string;
  status?: string;
  dims?: string;
  palette?: [string, string, string];
  note?: string;
  images?: ImageObj[];
  showOnIndex?: boolean;
  createdAt?: string;
  updatedAt?: string;
};
type UploadJson = {
  filename: string;
  originalName?: string;
  src: string;
  thumb?: string;
  size?: number;
  w?: number | null;
  h?: number | null;
  uploadedAt?: string;
};

async function main() {
  const db = getDb();
  console.log('→ reading JSON sources');
  const [artifactsJson, uploadsJson, profileJson] = await Promise.all([
    readJson<ArtifactJson[]>(path.join(root, 'data/artifacts.json'), []),
    readJson<UploadJson[]>(path.join(root, 'data/uploads.json'), []),
    readJson<Record<string, unknown>>(path.join(root, 'data/profile.json'), {}),
  ]);

  // ---- Blob migration ----
  const uploadsDir = path.join(root, 'public/uploads');
  const artifactsDir = path.join(root, 'public/artifacts');
  let blobCount = 0;

  console.log('→ uploading public/uploads → blobs');
  for (const file of await walk(uploadsDir)) {
    const rel = path.relative(uploadsDir, file).split(path.sep).join('/');
    await putImage(`uploads/${rel}`, await fs.readFile(file), guessType(file));
    blobCount++;
  }

  console.log('→ uploading public/artifacts → blobs');
  for (const file of await walk(artifactsDir)) {
    const rel = path.relative(artifactsDir, file).split(path.sep).join('/');
    await putImage(`artifacts/${rel}`, await fs.readFile(file), guessType(file));
    blobCount++;
  }
  console.log(`  ${blobCount} blob(s) written`);

  // ---- Postgres upserts ----
  console.log('→ upserting artifacts');
  for (const a of artifactsJson) {
    const values = {
      id: a.id,
      index: a.index ?? 0,
      catNo: a.catNo ?? '',
      title: a.title ?? '',
      year: a.year ?? new Date().getFullYear(),
      kind: a.kind ?? 'UNCLASSIFIED',
      production: a.production ?? '—',
      material: a.material ?? '—',
      finish: a.finish ?? '—',
      status: a.status ?? 'ARCHIVE',
      dims: a.dims ?? '',
      palette: (a.palette ?? ['#888888', '#aaaaaa', '#555555']) as [string, string, string],
      note: a.note ?? '',
      images: (a.images ?? []).map(rewriteImageUrls),
      showOnIndex: a.showOnIndex ?? true,
      createdAt: a.createdAt ? new Date(a.createdAt) : new Date(),
      updatedAt: a.updatedAt ? new Date(a.updatedAt) : new Date(),
    };
    await db.insert(artifactsTable).values(values).onConflictDoUpdate({
      target: artifactsTable.id,
      set: { ...values, updatedAt: new Date() },
    });
  }
  console.log(`  ${artifactsJson.length} artifact(s)`);

  console.log('→ upserting uploads');
  for (const u of uploadsJson) {
    const values = {
      filename: u.filename,
      originalName: u.originalName ?? u.filename,
      src: rewriteUrl(u.src),
      thumb: rewriteUrl(u.thumb ?? u.src),
      size: u.size ?? 0,
      w: u.w ?? null,
      h: u.h ?? null,
      uploadedAt: u.uploadedAt ? new Date(u.uploadedAt) : new Date(),
    };
    await db.insert(uploadsTable).values(values).onConflictDoUpdate({
      target: uploadsTable.filename,
      set: values,
    });
  }
  console.log(`  ${uploadsJson.length} upload(s)`);

  console.log('→ upserting profile');
  await db.insert(profileTable).values({ id: 1, data: profileJson, updatedAt: new Date() })
    .onConflictDoUpdate({ target: profileTable.id, set: { data: profileJson, updatedAt: new Date() } });

  console.log('✓ seed complete');
  process.exit(0);
}

async function readJson<T>(file: string, fallback: T): Promise<T> {
  try { return JSON.parse(await fs.readFile(file, 'utf8')) as T; }
  catch { return fallback; }
}

async function walk(dir: string): Promise<string[]> {
  const out: string[] = [];
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) out.push(...(await walk(full)));
      else out.push(full);
    }
  } catch {}
  return out;
}

function guessType(file: string): string {
  const ext = file.toLowerCase().split('.').pop();
  if (ext === 'webp') return 'image/webp';
  if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg';
  if (ext === 'png') return 'image/png';
  if (ext === 'gif') return 'image/gif';
  if (ext === 'avif') return 'image/avif';
  return 'application/octet-stream';
}

// /uploads/foo.webp    -> /api/img/uploads/foo.webp
// /artifacts/X/0.webp  -> /api/img/artifacts/X/0.webp
function rewriteUrl(u: string): string {
  if (!u || typeof u !== 'string') return u;
  if (u.startsWith('/api/img/')) return u;
  if (u.startsWith('/uploads/')) return '/api/img/uploads/' + u.slice('/uploads/'.length);
  if (u.startsWith('/artifacts/')) return '/api/img/artifacts/' + u.slice('/artifacts/'.length);
  return u;
}

function rewriteImageUrls(img: ImageObj): ImageObj {
  return { ...img, src: rewriteUrl(img.src), thumb: img.thumb ? rewriteUrl(img.thumb) : img.thumb };
}

main().catch((err) => {
  console.error('seed failed:', err);
  process.exit(1);
});

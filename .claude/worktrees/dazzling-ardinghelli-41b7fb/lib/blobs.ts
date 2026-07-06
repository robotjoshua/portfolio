import { getStore, type Store } from '@netlify/blobs';
import { promises as fs } from 'node:fs';
import path from 'node:path';

/**
 * Image storage wrapper.
 *
 * In production on Netlify: uses @netlify/blobs (store "portfolio-images").
 * Locally (outside Netlify dev): falls back to .blobs/ on disk so the app
 * runs without additional setup. Set NETLIFY_BLOBS_CONTEXT + NETLIFY_SITE_ID +
 * NETLIFY_TOKEN to force real Blobs in local dev.
 */

const STORE_NAME = 'portfolio-images';
const LOCAL_DIR = path.join(process.cwd(), '.blobs');

function shouldUseNetlifyBlobs(): boolean {
  // Netlify injects BLOBS_CONTEXT at runtime. When absent and the user hasn't
  // manually supplied the manual config, we use the local fallback.
  if (process.env.NETLIFY_BLOBS_CONTEXT) return true;
  if (process.env.BLOBS_CONTEXT) return true;
  if (process.env.NETLIFY_SITE_ID && process.env.NETLIFY_TOKEN) return true;
  return false;
}

function getNetlifyStore(): Store {
  if (process.env.NETLIFY_SITE_ID && process.env.NETLIFY_TOKEN) {
    return getStore({
      name: STORE_NAME,
      siteID: process.env.NETLIFY_SITE_ID,
      token: process.env.NETLIFY_TOKEN,
    });
  }
  return getStore(STORE_NAME);
}

async function ensureLocalDir(key: string): Promise<string> {
  const full = path.join(LOCAL_DIR, key);
  await fs.mkdir(path.dirname(full), { recursive: true });
  return full;
}

export async function putImage(key: string, buffer: Buffer, contentType = 'image/webp'): Promise<void> {
  if (shouldUseNetlifyBlobs()) {
    const store = getNetlifyStore();
    const ab = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;
    await store.set(key, ab, { metadata: { contentType } });
    return;
  }
  const full = await ensureLocalDir(key);
  await fs.writeFile(full, buffer);
  await fs.writeFile(full + '.meta', JSON.stringify({ contentType }), 'utf8');
}

export async function getImage(key: string): Promise<{ body: Buffer; contentType: string } | null> {
  if (shouldUseNetlifyBlobs()) {
    const store = getNetlifyStore();
    const result = await store.getWithMetadata(key, { type: 'arrayBuffer' });
    if (!result) return null;
    const body = Buffer.from(result.data as ArrayBuffer);
    const contentType = (result.metadata?.contentType as string | undefined) ?? guessType(key);
    return { body, contentType };
  }
  const full = path.join(LOCAL_DIR, key);
  try {
    const body = await fs.readFile(full);
    let contentType = guessType(key);
    try {
      const meta = JSON.parse(await fs.readFile(full + '.meta', 'utf8')) as { contentType?: string };
      if (meta.contentType) contentType = meta.contentType;
    } catch {}
    return { body, contentType };
  } catch {
    return null;
  }
}

export async function deleteImage(key: string): Promise<void> {
  if (shouldUseNetlifyBlobs()) {
    const store = getNetlifyStore();
    await store.delete(key);
    return;
  }
  const full = path.join(LOCAL_DIR, key);
  await fs.rm(full, { force: true });
  await fs.rm(full + '.meta', { force: true });
}

export async function listImages(prefix: string): Promise<string[]> {
  if (shouldUseNetlifyBlobs()) {
    const store = getNetlifyStore();
    const result = await store.list({ prefix });
    return result.blobs.map((b) => b.key);
  }
  const dir = path.join(LOCAL_DIR, prefix);
  try {
    const entries = await collectFiles(dir);
    return entries.map((p) => path.relative(LOCAL_DIR, p).split(path.sep).join('/'))
      .filter((k) => !k.endsWith('.meta'));
  } catch {
    return [];
  }
}

async function collectFiles(dir: string): Promise<string[]> {
  const out: string[] = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...(await collectFiles(full)));
    else out.push(full);
  }
  return out;
}

function guessType(key: string): string {
  const ext = key.toLowerCase().split('.').pop() ?? '';
  if (ext === 'webp') return 'image/webp';
  if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg';
  if (ext === 'png') return 'image/png';
  if (ext === 'gif') return 'image/gif';
  if (ext === 'avif') return 'image/avif';
  return 'application/octet-stream';
}

/** Public URL shape for an image stored under a given key. */
export function imgUrl(key: string): string {
  return `/api/img/${key.split('/').map(encodeURIComponent).join('/')}`;
}

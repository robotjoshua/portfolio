/**
 * Upload all files in .blobs/ to the production Netlify Blobs store.
 *
 * Required env vars (set inline for one-shot run):
 *   NETLIFY_SITE_ID  – from Netlify → Site configuration → General → Site ID
 *   NETLIFY_TOKEN    – personal access token: https://app.netlify.com/user/applications#personal-access-tokens
 *
 * Usage:
 *   NETLIFY_SITE_ID=xxx NETLIFY_TOKEN=yyy npx tsx scripts/blobs-sync.ts
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { getStore } from '@netlify/blobs';

const STORE_NAME = 'portfolio-images';
const LOCAL_DIR = path.join(process.cwd(), '.blobs');

async function walk(dir: string): Promise<string[]> {
  const out: string[] = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(full)));
    else out.push(full);
  }
  return out;
}

async function main() {
  const siteID = process.env.NETLIFY_SITE_ID;
  const token = process.env.NETLIFY_TOKEN;
  if (!siteID || !token) {
    console.error('Missing NETLIFY_SITE_ID or NETLIFY_TOKEN env.');
    process.exit(1);
  }
  const store = getStore({ name: STORE_NAME, siteID, token });

  const all = await walk(LOCAL_DIR);
  const images = all.filter((p) => !p.endsWith('.meta'));
  console.log(`Uploading ${images.length} blobs -> ${STORE_NAME} ...`);

  let ok = 0;
  let fail = 0;
  for (const full of images) {
    const rel = path.relative(LOCAL_DIR, full).split(path.sep).join('/');
    try {
      const buf = await fs.readFile(full);
      let contentType = 'image/webp';
      try {
        const meta = JSON.parse(await fs.readFile(full + '.meta', 'utf8')) as { contentType?: string };
        if (meta.contentType) contentType = meta.contentType;
      } catch {}
      const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
      await store.set(rel, ab, { metadata: { contentType } });
      ok++;
      if (ok % 25 === 0) console.log(`  ${ok}/${images.length}`);
    } catch (err) {
      fail++;
      console.error(`  FAIL ${rel}:`, (err as Error).message);
    }
  }
  console.log(`Done. ${ok} uploaded, ${fail} failed.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

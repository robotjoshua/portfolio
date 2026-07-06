#!/usr/bin/env node
// Physically excise admin routes + API handlers before a static export,
// then restore them afterwards. Keeps the production bundle tiny and ensures
// `output: 'export'` never tries to serialize server-only code.
//
// Usage:
//   node scripts/prebuild-static.mjs --out   # move out of tree
//   node scripts/prebuild-static.mjs --in    # restore

import { promises as fs } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const PAIRS = [
  { live: 'app/admin', stash: '.admin-bundle' },
  { live: 'app/api', stash: '.api-bundle' },
];

async function exists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function move(from, to) {
  if (!(await exists(from))) return false;
  if (await exists(to)) {
    console.warn(`[prebuild] destination exists, skipping: ${to}`);
    return false;
  }
  await fs.rename(from, to);
  return true;
}

async function out() {
  for (const { live, stash } of PAIRS) {
    const ok = await move(path.join(root, live), path.join(root, stash));
    if (ok) console.log(`[prebuild] stashed ${live} → ${stash}`);
  }
}

async function restore() {
  for (const { live, stash } of PAIRS) {
    const ok = await move(path.join(root, stash), path.join(root, live));
    if (ok) console.log(`[prebuild] restored ${stash} → ${live}`);
  }
}

const flag = process.argv[2];
if (flag === '--out') await out();
else if (flag === '--in') await restore();
else {
  console.error('usage: prebuild-static.mjs --out | --in');
  process.exit(1);
}

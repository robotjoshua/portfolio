// One-shot: regenerate the original 40 hashed placeholders into data/artifacts.json.
// Safe to run anytime; will OVERWRITE existing file. Prompts if file non-empty.

import { promises as fs } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const ROOT = process.cwd();
const OUT = path.join(ROOT, 'data', 'artifacts.json');

function hash(n, s = 0) {
  const x = (n * 9301 + s * 49297 + 233280) % 233280;
  return x / 233280;
}
const pad = (n, w = 3) => String(n).padStart(w, '0');

const KINDS = ['WEAPON', 'ARMOR', 'TECH', 'SET-DRESS', 'HERO', 'GRAPHIC'];
const PRODUCTIONS = [
  ['Horizon Protocol', 'US'], ['Ironclad', 'US'],
  ['Neon Requiem', 'US'], ['The Variant', 'US'],
  ['Void Station', 'CA'], ['Deep Cut', 'US'],
  ['Parallel', 'UK'], ['Echelon Rising', 'CZ'],
  ['WonderCon 2024', 'US'], ['Denver Comic-Con', 'US'],
];
const MATERIALS = [
  'EVA foam, contact cement', 'Thermoplastic (Worbla)', 'Urethane resin, cast',
  '3D print (PLA), filler primer', 'Aluminum sheet, pop rivets',
  'Foam clay over wire armature', 'MDF, Bondo, high-build primer',
  'Laser-cut acrylic, vinyl wrap', 'Carbon fiber laminate', 'Mixed: resin + foam core',
];
const FINISHES = [
  'Flat black, enamel wash', 'Chrome powder, sealed', 'Metallic rub, patina wash',
  'Airbrush gradient, matte seal', 'Battle-worn, chipping fluid', 'High-gloss lacquer',
  'Matte topcoat, grime washes', 'Brushed aluminum effect', 'Rust/oxide effect, sealed',
  'Painted + LED integrated',
];
const STATUSES = ['HERO', 'STUNT', 'DISPLAY', 'ARCHIVE'];
const TITLES = [
  'Sidearm · 01', 'Sidearm · 02', 'Sidearm · 03', 'Blade Rig · 01', 'Blade Rig · 02',
  'Carbine · 01', 'Carbine · 02', 'Helm · 01', 'Helm · 02', 'Helm · 03',
  'Chestpiece · 01', 'Chestpiece · 02', 'Gauntlet Set · 01', 'Pauldron Set · 01',
  'Vambrace Pair · 01', 'Scanner Unit · 01', 'Scanner Unit · 02', 'Comm Device · 01',
  'Console Panel · 01', 'Holo Module · 01', 'Data Pad · 01', 'Tracker Unit · 01',
  'Crate Set · 01', 'Book Prop · 01', 'Terminal · 01', 'Wall Plaque · 01',
  'Hero Sword · 01', 'Hero Shield · 01', 'Staff Prop · 01', 'Feature Helm · 01',
  'Badge Plate · 01', 'Insignia Set · 01', 'Decal Sheet · 01', 'Patch Design · 01',
  'Grenade · 01', 'Grenade · 02', 'Backpack Rig · 01', 'Wrist Unit · 01',
  'Medallion · 01', 'Floor Unit · 01',
];
const PALETTES = [
  ['#1a1a18', '#8a7a6a', '#e4dfd4'], ['#1a1a18', '#b14a36', '#e9ecdf'],
  ['#2a2018', '#7a6040', '#d4c8a8'], ['#181818', '#484848', '#d8d8d8'],
  ['#1a1818', '#604840', '#d8ccc4'], ['#101418', '#405060', '#c8d4dc'],
  ['#1a1a18', '#7a7868', '#dcdad0'], ['#2a2820', '#5a5248', '#ccc4b8'],
];
const NOTES = [
  'Commissioned for principal photography. Hero build, single unit.',
  'Paired with matching scabbard, archived separately.',
  'Structural test passed — stunt crew approved for contact.',
  'LED system integrated; 3 hr runtime on lithium cell pack.',
  'Vacuum-formed over buck. Surface dressed by set dec on location.',
  'Original design; client approved at concept review 02.',
];

const now = new Date().toISOString();

const artifacts = Array.from({ length: 40 }, (_, i) => {
  const h = (k) => hash(i, k);
  const year = [2021, 2022, 2023, 2024, 2025][Math.floor(h(1) * 5)];
  const prod = PRODUCTIONS[Math.floor(h(2) * PRODUCTIONS.length)];
  const kind = KINDS[Math.floor(h(3) * KINDS.length)];
  const pal = PALETTES[Math.floor(h(4) * PALETTES.length)];
  const mat = MATERIALS[Math.floor(h(5) * MATERIALS.length)];
  const fin = FINISHES[Math.floor(h(6) * FINISHES.length)];
  const stat = STATUSES[Math.floor(h(7) * STATUSES.length)];
  const w = [12, 18, 24, 30, 8, 42][Math.floor(h(8) * 6)];
  const hh = [10, 16, 22, 30, 6, 38][Math.floor(h(9) * 6)];
  const d = [4, 6, 8, 10, 3, 12][Math.floor(h(10) * 6)];
  return {
    id: `JP-${pad(i + 1)}`,
    catNo: `${kind}.${year}.${pad(i + 1, 2)}`,
    title: TITLES[i % TITLES.length],
    year,
    kind,
    production: prod[0],
    material: mat,
    finish: fin,
    status: stat,
    dims: `${hh} × ${w} × ${d} cm`,
    palette: pal,
    note: NOTES[Math.floor(h(12) * NOTES.length)],
    images: [],
    index: i + 1,
    createdAt: now,
    updatedAt: now,
  };
});

await fs.mkdir(path.dirname(OUT), { recursive: true });

let existing = null;
try {
  existing = await fs.readFile(OUT, 'utf8');
} catch { /* ok */ }

if (existing && !process.argv.includes('--force')) {
  console.error(`✕ ${OUT} already exists. Re-run with --force to overwrite.`);
  process.exit(1);
}

await fs.writeFile(OUT, JSON.stringify(artifacts, null, 2) + '\n', 'utf8');
console.log(`✓ wrote ${artifacts.length} artifacts → ${path.relative(ROOT, OUT)}`);

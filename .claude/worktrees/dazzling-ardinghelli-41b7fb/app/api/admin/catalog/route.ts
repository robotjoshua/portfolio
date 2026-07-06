import { NextRequest, NextResponse } from 'next/server';
import path from 'node:path';
import sharp from 'sharp';
import exifr from 'exifr';
import { guardAdmin } from '../_guard';
import { getImage } from '@/lib/blobs';
import type { Kind } from '@/types/artifact';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ─── types ────────────────────────────────────────────────────────────────────

export interface CatalogResult {
  title: string;
  year: number;
  kind: Kind;
  material: string;
  note: string;
  alt: string;
  tags: string[];
  palette: [string, string, string];
  needsReview: boolean;
  source: 'claude' | 'local';
}

// ─── helpers ──────────────────────────────────────────────────────────────────

const KIND_KEYWORDS: Array<[string, Kind]> = [
  ['weapon', 'WEAPON'], ['gun', 'WEAPON'], ['sword', 'WEAPON'], ['knife', 'WEAPON'], ['blade', 'WEAPON'],
  ['rifle', 'WEAPON'], ['pistol', 'WEAPON'],
  ['armor', 'ARMOR'], ['suit', 'ARMOR'], ['helmet', 'ARMOR'], ['shield', 'ARMOR'],
  ['graphic', 'GRAPHIC'], ['print', 'GRAPHIC'], ['sign', 'GRAPHIC'], ['label', 'GRAPHIC'],
  ['hero', 'HERO'],
  ['set', 'SET-DRESS'], ['dress', 'SET-DRESS'], ['furniture', 'SET-DRESS'], ['decor', 'SET-DRESS'],
];

function guessKind(text: string): Kind {
  const lower = text.toLowerCase();
  for (const [kw, kind] of KIND_KEYWORDS) {
    if (lower.includes(kw)) return kind;
  }
  return 'TECH';
}

function extractYear(s: string): number {
  const m = s.match(/\b(19|20)\d{2}\b/);
  return m ? parseInt(m[0], 10) : new Date().getFullYear();
}

function toHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
}

function titleFromFilename(filename: string): string {
  return filename
    .replace(/\.[^.]+$/, '')            // strip extension
    .replace(/[_-]+/g, ' ')             // underscores/hyphens → spaces
    .replace(/\b\w/g, (c) => c.toUpperCase()) // title case
    .trim() || 'Untitled';
}

// Extract 3 palette colors by sampling top, middle, bottom thirds
async function extractPalette(buf: Buffer): Promise<[string, string, string]> {
  try {
    const meta = await sharp(buf).metadata();
    if (!meta.width || !meta.height) throw new Error('no dimensions');
    const width: number = meta.width;
    const height: number = meta.height;
    const third = Math.floor(height / 3);

    async function regionColor(top: number, h: number): Promise<string> {
      const raw = await sharp(buf)
        .extract({ left: 0, top, width, height: Math.max(1, h) })
        .resize(1, 1, { fit: 'fill' })
        .raw()
        .toBuffer();
      return toHex(raw[0], raw[1], raw[2]);
    }

    const [c1, c2, c3] = await Promise.all([
      regionColor(0, third),
      regionColor(third, third),
      regionColor(third * 2, height - third * 2),
    ]);
    return [c1, c2, c3];
  } catch {
    return ['#1a1a18', '#7a7868', '#dcdad0'];
  }
}

// ─── local analysis ───────────────────────────────────────────────────────────

async function analyzeLocal(buf: Buffer, filename: string, context: string): Promise<CatalogResult> {
  const [exif, palette] = await Promise.all([
    exifr.parse(buf, {
      pick: ['DateTimeOriginal', 'CreateDate', 'GPSLatitude', 'GPSLongitude',
             'Make', 'Model', 'ImageDescription', 'Keywords'],
    }).catch(() => null),
    extractPalette(buf),
  ]);

  const dateStr: string =
    (exif?.DateTimeOriginal ?? exif?.CreateDate)?.toISOString?.() ?? '';
  const year = dateStr ? extractYear(dateStr) : new Date().getFullYear();

  const camera = [exif?.Make, exif?.Model].filter(Boolean).join(' ');
  const gps =
    exif?.GPSLatitude && exif?.GPSLongitude
      ? `${exif.GPSLatitude.toFixed(4)}, ${exif.GPSLongitude.toFixed(4)}`
      : '';

  const noteparts = [
    context || '',
    exif?.ImageDescription,
    camera ? `Shot on ${camera}` : '',
    gps ? `GPS: ${gps}` : '',
  ].filter(Boolean);

  const rawTitle = context
    ? context.split('·')[0].trim() || titleFromFilename(filename)
    : titleFromFilename(filename);
  const tags: string[] = Array.isArray(exif?.Keywords)
    ? exif.Keywords as string[]
    : exif?.Keywords
    ? [String(exif.Keywords)]
    : [];

  return {
    title: rawTitle,
    year,
    kind: guessKind(filename),
    material: '',
    note: noteparts.join(' · ') || '',
    alt: '',
    tags,
    palette,
    needsReview: true,
    source: 'local',
  };
}

// ─── fiction generator (categorical · nondescript · deterministic) ───────────

const FICTION_KINDS: Kind[] = ['WEAPON', 'ARMOR', 'GRAPHIC', 'SET-DRESS', 'TECH', 'HERO'];
const FICTION_PRODUCTIONS = [
  'Echelon Rising', 'Ninth Archive', 'Whitebox Studio', 'Harbor Unit',
  'Untitled Project 04', 'Bureau of Records', 'Field Series B',
  'Conservatory', 'Lot 47', 'North Stage', 'Quiet Protocol', 'Redlands',
];
const FICTION_MATERIALS = [
  'Resin · MDF', 'Aluminum · EVA', 'Steel · Brass', 'Urethane', 'ABS · Vinyl',
  'Birch Ply · Epoxy', 'Silicone · Foam', 'Cast Resin', 'Acrylic · Polymer',
];
const FICTION_FINISHES = [
  'Matte Grey', 'Weathered Black', 'Brushed Nickel', 'Flat Olive',
  'Gloss Charcoal', 'Distressed Ivory', 'Oxidized Copper', 'Satin Neutral',
];
const FICTION_TAGS = [
  'prototype', 'field', 'restored', 'archive', 'master', 'backup',
  'specimen', 'reference', 'continuity', 'hero', 'stunt', 'dressing',
];
const FICTION_NOTES = [
  'Archive entry · specimen cataloged under routine intake.',
  'Unit held for reference. No distinguishing marks recorded.',
  'Catalog intake · provenance pending · stored under standard protocol.',
  'Placeholder record · fabrication details to be confirmed.',
  'Logged during batch processing. Metadata generic by policy.',
  'Reference specimen · awaiting full documentation pass.',
];

function hash32(s: string): number {
  let h = 2166136261 | 0;
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  }
  return h >>> 0;
}

function pick<T>(arr: T[], seed: number): T {
  const i = ((seed >>> 0) % arr.length);
  return arr[i];
}

async function analyzeFiction(buf: Buffer, filename: string, context: string): Promise<CatalogResult> {
  const palette = await extractPalette(buf);
  const seed = hash32(filename + ':' + context);
  const kind = pick(FICTION_KINDS, seed);
  const production = pick(FICTION_PRODUCTIONS, seed >>> 3);
  const material = pick(FICTION_MATERIALS, seed >>> 6) + ' · ' + pick(FICTION_FINISHES, seed >>> 9);
  const note = pick(FICTION_NOTES, seed >>> 12);
  const tagA = pick(FICTION_TAGS, seed >>> 15);
  const tagB = pick(FICTION_TAGS, (seed >>> 18) + 1);
  const year = 2015 + ((seed >>> 0) % 11);
  const lot = (((seed >>> 4) % 900) + 100).toString();
  const unit = (((seed >>> 10) % 90) + 10).toString();
  const title = `Unit ${lot}-${unit}`;
  const alt = 'Archive specimen · categorical entry.';
  const noteWithContext = context ? `${note} · ${context}` : `${note} · ${production}`;

  return {
    title,
    year,
    kind,
    material,
    note: noteWithContext,
    alt,
    tags: Array.from(new Set([tagA, tagB, 'fiction'])),
    palette,
    needsReview: false,
    source: 'local',
  };
}

// ─── claude analysis ──────────────────────────────────────────────────────────

const SYSTEM = `You analyze one uploaded image and return strict JSON for local website/catalog use. Be literal, concise, and conservative. Use a simple searchable title. Do not invent facts. If something is not visible or provided, use "unknown". If ambiguous, set needs_human_review to true. Return only valid JSON with this schema:
{"simple_title":"","slug":"","date":{"value":"","confidence":""},"location":{"value":"","confidence":""},"prop_or_subject_name":"","category":"","short_description":"","materials":[{"value":"","confidence":""}],"colors":[],"style_or_era":{"value":"","confidence":""},"condition":"","visible_text":[],"tags":[],"alt_text":"","confidence_notes":"","needs_human_review":false}
Confidence values: certain, probable, possible, unknown.`;

async function analyzeClaude(buf: Buffer, filename: string, context: string): Promise<CatalogResult> {
  const Anthropic = (await import('@anthropic-ai/sdk')).default;
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const msg = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: SYSTEM,
    messages: [{
      role: 'user',
      content: [
        {
          type: 'text',
          text: `Analyze this prop image for a film/TV prop fabrication catalog. Filename: ${filename}${context ? `\nContext: ${context}` : ''}\nReturn only valid JSON.`,
        },
        {
          type: 'image',
          source: { type: 'base64', media_type: 'image/webp', data: buf.toString('base64') },
        },
      ],
    }],
  });

  const text = msg.content[0].type === 'text' ? msg.content[0].text : '';
  const match = text.match(/\{[\s\S]*\}/);
  const raw = JSON.parse(match?.[0] ?? text) as Record<string, unknown>;

  const materials = Array.isArray(raw.materials)
    ? (raw.materials as Array<{ value?: string }>).map((m) => m.value ?? '').filter(Boolean).join(', ')
    : String(raw.materials ?? '');

  const palette = await extractPalette(buf);

  return {
    title: String(raw.simple_title || raw.prop_or_subject_name || 'Untitled'),
    year: extractYear(String((raw.date as { value?: string } | undefined)?.value ?? '')),
    kind: guessKind(String(raw.category ?? '')),
    material: materials,
    note: String(raw.short_description ?? ''),
    alt: String(raw.alt_text ?? ''),
    tags: Array.isArray(raw.tags) ? (raw.tags as string[]) : [],
    palette,
    needsReview: Boolean(raw.needs_human_review),
    source: 'claude',
  };
}

// ─── route ────────────────────────────────────────────────────────────────────

function srcToBlobKey(src: string): string | null {
  const blob = src.match(/^\/api\/img\/(.+)$/);
  if (blob) return decodeURIComponent(blob[1]).split('/').map((s) => decodeURIComponent(s)).join('/');
  const uploads = src.match(/^\/uploads\/(.+)$/);
  if (uploads) return `uploads/${uploads[1]}`;
  const arts = src.match(/^\/artifacts\/(.+)$/);
  if (arts) return `artifacts/${arts[1]}`;
  return null;
}

export async function POST(req: NextRequest) {
  const blocked = await guardAdmin(req);
  if (blocked) return blocked;

  const body = (await req.json()) as { src: string; context?: string; mode?: 'auto' | 'local' | 'claude' | 'fiction' };
  if (!body.src) return NextResponse.json({ error: 'no src' }, { status: 400 });
  const context = (body.context ?? '').trim();
  const mode = body.mode ?? 'auto';

  const key = srcToBlobKey(body.src);
  if (!key) return NextResponse.json({ error: 'unsupported src' }, { status: 400 });
  const hit = await getImage(key);
  if (!hit) return NextResponse.json({ error: 'file not found' }, { status: 404 });
  const buf = hit.body;

  const filename = path.basename(key);

  try {
    let result: CatalogResult;
    if (mode === 'fiction') {
      result = await analyzeFiction(buf, filename, context);
    } else if (mode === 'local') {
      result = await analyzeLocal(buf, filename, context);
    } else if (mode === 'claude') {
      result = await analyzeClaude(buf, filename, context);
    } else {
      result = process.env.ANTHROPIC_API_KEY
        ? await analyzeClaude(buf, filename, context)
        : await analyzeLocal(buf, filename, context);
    }
    return NextResponse.json(result);
  } catch (e) {
    console.error('[catalog]', e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

import 'server-only';
import { asc, eq, sql } from 'drizzle-orm';
import { getDb, schema } from './db/client';
import type { Artifact } from '@/types/artifact';

function rowToArtifact(row: typeof schema.artifacts.$inferSelect): Artifact {
  return {
    id: row.id,
    index: row.index,
    catNo: row.catNo,
    title: row.title,
    year: row.year,
    kind: row.kind,
    production: row.production,
    material: row.material,
    finish: row.finish,
    status: row.status,
    dims: row.dims,
    palette: row.palette,
    note: row.note ?? undefined,
    images: row.images ?? [],
    showOnIndex: row.showOnIndex,
    createdAt: row.createdAt?.toISOString(),
    updatedAt: row.updatedAt?.toISOString(),
  };
}

function artifactToInsert(a: Artifact): typeof schema.artifacts.$inferInsert {
  return {
    id: a.id,
    index: a.index,
    catNo: a.catNo,
    title: a.title,
    year: a.year,
    kind: a.kind,
    production: a.production,
    material: a.material,
    finish: a.finish,
    status: a.status,
    dims: a.dims,
    palette: a.palette,
    note: a.note ?? null,
    images: a.images ?? [],
    showOnIndex: a.showOnIndex !== false,
  };
}

export async function readArtifacts(): Promise<Artifact[]> {
  const db = getDb();
  const rows = await db.select().from(schema.artifacts).orderBy(asc(schema.artifacts.index));
  return rows.map(rowToArtifact);
}

export async function writeArtifacts(list: Artifact[]): Promise<void> {
  const db = getDb();
  await db.transaction(async (tx) => {
    await tx.delete(schema.artifacts);
    if (list.length) {
      await tx.insert(schema.artifacts).values(list.map(artifactToInsert));
    }
  });
}

export async function upsertArtifact(a: Artifact): Promise<void> {
  const db = getDb();
  const values = artifactToInsert(a);
  await db.insert(schema.artifacts)
    .values(values)
    .onConflictDoUpdate({
      target: schema.artifacts.id,
      set: { ...values, updatedAt: sql`now()` },
    });
}

export async function deleteArtifact(id: string): Promise<boolean> {
  const db = getDb();
  const res = await db.delete(schema.artifacts).where(eq(schema.artifacts.id, id)).returning({ id: schema.artifacts.id });
  return res.length > 0;
}

export async function getArtifact(id: string): Promise<Artifact | null> {
  const db = getDb();
  const rows = await db.select().from(schema.artifacts).where(eq(schema.artifacts.id, id)).limit(1);
  return rows[0] ? rowToArtifact(rows[0]) : null;
}

export async function nextArtifactId(): Promise<{ id: string; index: number }> {
  const db = getDb();
  const rows = await db
    .select({ max: sql<number>`coalesce(max(${schema.artifacts.index}), 0)` })
    .from(schema.artifacts);
  const index = (rows[0]?.max ?? 0) + 1;
  return { id: `JP-${String(index).padStart(3, '0')}`, index };
}

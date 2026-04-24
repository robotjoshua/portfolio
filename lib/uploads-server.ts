import 'server-only';
import { desc, eq } from 'drizzle-orm';
import { getDb, schema } from './db/client';
import type { UploadedFile } from '@/types/upload';

function rowToUpload(row: typeof schema.uploads.$inferSelect): UploadedFile {
  return {
    filename: row.filename,
    originalName: row.originalName,
    src: row.src,
    thumb: row.thumb,
    size: row.size ?? 0,
    w: row.w ?? undefined,
    h: row.h ?? undefined,
    uploadedAt: row.uploadedAt.toISOString(),
  };
}

export async function readUploads(): Promise<UploadedFile[]> {
  const db = getDb();
  const rows = await db.select().from(schema.uploads).orderBy(desc(schema.uploads.uploadedAt));
  return rows.map(rowToUpload);
}

export async function writeUploads(list: UploadedFile[]): Promise<void> {
  const db = getDb();
  await db.transaction(async (tx) => {
    await tx.delete(schema.uploads);
    if (list.length) {
      await tx.insert(schema.uploads).values(list.map((f) => ({
        filename: f.filename,
        originalName: f.originalName,
        src: f.src,
        thumb: f.thumb,
        size: f.size ?? 0,
        w: f.w ?? null,
        h: f.h ?? null,
        uploadedAt: new Date(f.uploadedAt),
      })));
    }
  });
}

export async function appendUpload(file: UploadedFile): Promise<void> {
  const db = getDb();
  await db.insert(schema.uploads).values({
    filename: file.filename,
    originalName: file.originalName,
    src: file.src,
    thumb: file.thumb,
    size: file.size ?? 0,
    w: file.w ?? null,
    h: file.h ?? null,
    uploadedAt: new Date(file.uploadedAt),
  }).onConflictDoNothing();
}

export async function removeUpload(filename: string): Promise<UploadedFile | null> {
  const db = getDb();
  const [row] = await db.delete(schema.uploads).where(eq(schema.uploads.filename, filename)).returning();
  return row ? rowToUpload(row) : null;
}

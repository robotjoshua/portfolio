import { pgTable, text, integer, boolean, jsonb, timestamp } from 'drizzle-orm/pg-core';

export const artifacts = pgTable('artifacts', {
  id: text('id').primaryKey(),
  index: integer('index').notNull(),
  catNo: text('cat_no').notNull(),
  title: text('title').notNull(),
  year: integer('year').notNull(),
  kind: text('kind').notNull(),
  production: text('production').notNull(),
  material: text('material').notNull(),
  finish: text('finish').notNull(),
  status: text('status').notNull(),
  dims: text('dims').notNull(),
  palette: jsonb('palette').$type<[string, string, string]>().notNull(),
  note: text('note'),
  images: jsonb('images').$type<Array<{ src: string; thumb?: string; w?: number; h?: number; alt?: string; caption?: string }>>().default([]).notNull(),
  showOnIndex: boolean('show_on_index').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const uploads = pgTable('uploads', {
  filename: text('filename').primaryKey(),
  originalName: text('original_name').notNull(),
  src: text('src').notNull(),
  thumb: text('thumb').notNull(),
  size: integer('size').notNull().default(0),
  w: integer('w'),
  h: integer('h'),
  uploadedAt: timestamp('uploaded_at', { withTimezone: true }).defaultNow().notNull(),
});

export const profile = pgTable('profile', {
  id: integer('id').primaryKey(),
  data: jsonb('data').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

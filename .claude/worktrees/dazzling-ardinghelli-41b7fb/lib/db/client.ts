import { drizzle as drizzleHttp } from 'drizzle-orm/neon-http';
import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres';
import { neon } from '@neondatabase/serverless';
import { Pool } from 'pg';
import * as schema from './schema';

type Db = ReturnType<typeof drizzlePg<typeof schema>>;
let _db: Db | null = null;

export function getDb(): Db {
  if (_db) return _db;
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      'DATABASE_URL is not set. Provision a Postgres database (Neon works free) and set DATABASE_URL in .env.local.'
    );
  }
  // Prefer the Neon HTTP driver (works in serverless, no connection pools).
  // Fall back to node-postgres for local or non-Neon databases.
  if (/neon\.tech/.test(url)) {
    const sql = neon(url);
    _db = drizzleHttp(sql, { schema }) as unknown as Db;
  } else {
    const ssl = process.env.DATABASE_SSL === '0' ? false : { rejectUnauthorized: false };
    const pool = new Pool({ connectionString: url, ssl, max: 4 });
    _db = drizzlePg(pool, { schema });
  }
  return _db;
}

export { schema };

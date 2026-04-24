import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

let _pool: Pool | null = null;
let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;

function getPool(): Pool {
  if (_pool) return _pool;
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      'DATABASE_URL is not set. Provision a Postgres database (Neon works free) and set DATABASE_URL in .env.local.'
    );
  }
  // Neon requires SSL; most hosted Postgres do too. Local dev against plain postgres: set DATABASE_SSL=0.
  const ssl = process.env.DATABASE_SSL === '0' ? false : { rejectUnauthorized: false };
  _pool = new Pool({ connectionString: url, ssl, max: 4 });
  return _pool;
}

export function getDb() {
  if (_db) return _db;
  _db = drizzle(getPool(), { schema });
  return _db;
}

export { schema };

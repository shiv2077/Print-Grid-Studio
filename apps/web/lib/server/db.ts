import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

declare global {
  // eslint-disable-next-line no-var
  var __pgDb: PostgresJsDatabase<typeof schema> | undefined;
}

/**
 * Lazily create one Drizzle instance, reused across warm lambdas / hot reloads.
 * Lazy so importing the repo (e.g. in tests, or at Next build) never needs the
 * DB connection — it's only created on first real query.
 * prepare:false is required for the Supabase transaction pooler (pgbouncer).
 */
export function getDb(): PostgresJsDatabase<typeof schema> {
  if (global.__pgDb) return global.__pgDb;
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set');
  const client = postgres(url, { ssl: 'require', prepare: false, max: 1 });
  global.__pgDb = drizzle(client, { schema });
  return global.__pgDb;
}

export { schema };

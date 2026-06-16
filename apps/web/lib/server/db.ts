import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Reuse one client across warm lambdas / dev hot-reloads.
declare global {
  // eslint-disable-next-line no-var
  var __pgClient: ReturnType<typeof postgres> | undefined;
}

function makeClient() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set');
  // prepare:false is required for the Supabase transaction pooler (pgbouncer);
  // it is also harmless on a direct connection. ssl required.
  return postgres(url, { ssl: 'require', prepare: false, max: 1 });
}

const client = global.__pgClient ?? makeClient();
if (process.env.NODE_ENV !== 'production') global.__pgClient = client;

export const db = drizzle(client, { schema });
export { schema };

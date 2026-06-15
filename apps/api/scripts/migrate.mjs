// Apply every supabase/migrations/*.sql in filename order. Idempotent SQL.
import postgres from 'postgres';
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { loadEnv } from './_env.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const migDir = join(here, '..', '..', '..', 'supabase', 'migrations');
const env = loadEnv();
const sql = postgres(env.DATABASE_URL, { ssl: 'require', max: 1 });

try {
  const files = readdirSync(migDir).filter((f) => f.endsWith('.sql')).sort();
  for (const f of files) {
    const ddl = readFileSync(join(migDir, f), 'utf8');
    await sql.unsafe(ddl);
    console.log(`applied: ${f}`);
  }
  const tables = await sql`
    select table_name from information_schema.tables
    where table_schema = 'public' and table_name in ('orders','order_files')
    order by table_name`;
  console.log('tables present:', tables.map((t) => t.table_name).join(', '));
  await sql.end();
} catch (e) {
  console.error('MIGRATE FAILED:', e.message);
  try { await sql.end(); } catch {}
  process.exit(1);
}

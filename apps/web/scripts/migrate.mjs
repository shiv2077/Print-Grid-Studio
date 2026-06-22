// Apply every supabase/migrations/*.sql in order (idempotent SQL).
// Reads DATABASE_URL from apps/web/.env.local. Usage: node scripts/migrate.mjs
import postgres from 'postgres';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '..', '..', '..');
const envText = readFileSync(join(here, '..', '.env.local'), 'utf8');
const m = envText.match(/^DATABASE_URL\s*=\s*"?([^"\n]+)"?/m);
if (!m) {
  console.error('DATABASE_URL not found in apps/web/.env.local');
  process.exit(1);
}
const sql = postgres(m[1], { ssl: 'require', prepare: false, max: 1 });
const dir = join(repoRoot, 'supabase', 'migrations');
try {
  for (const f of readdirSync(dir).filter((x) => x.endsWith('.sql')).sort()) {
    await sql.unsafe(readFileSync(join(dir, f), 'utf8'));
    console.log('applied:', f);
  }
  const cols = await sql`
    select column_name from information_schema.columns
    where table_name = 'orders' and column_name like 'ship_%' order by column_name`;
  console.log('ship_* columns:', cols.map((c) => c.column_name).join(', '));
  await sql.end();
} catch (e) {
  console.error('MIGRATE FAILED:', e.message);
  try { await sql.end(); } catch {}
  process.exit(1);
}

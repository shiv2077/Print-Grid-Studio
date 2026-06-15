// M2.1 gate: insert an order row via the real Drizzle schema, read it back, clean up.
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { orders, orderFiles } from '../src/db/schema';

const here = dirname(fileURLToPath(import.meta.url));
const raw = readFileSync(join(here, '..', '.env'), 'utf8');
const env: Record<string, string> = {};
for (const line of raw.split('\n')) {
  const t = line.trim();
  if (!t || t.startsWith('#') || !t.includes('=')) continue;
  const i = t.indexOf('=');
  env[t.slice(0, i).trim()] = t.slice(i + 1).trim().replace(/^"|"$/g, '');
}

const client = postgres(env.DATABASE_URL, { ssl: 'require', max: 1 });
const db = drizzle(client, { schema: { orders, orderFiles } });

async function main() {
  const code = `PG-SMOKE-${process.pid}`;
  const [inserted] = await db
    .insert(orders)
    .values({ orderCode: code, amountPaise: 120615, serverVolumeMm3: 12345.6, currency: 'INR' })
    .returning();
  const [readBack] = await db.select().from(orders).where(eq(orders.orderCode, code)).limit(1);

  const ok =
    readBack &&
    readBack.id === inserted.id &&
    readBack.amountPaise === 120615 &&
    readBack.status === 'pending';

  // clean up the smoke row so we don't leave test garbage
  await db.delete(orders).where(eq(orders.orderCode, code));

  console.log(
    'SMOKE',
    ok ? 'OK' : 'FAILED',
    JSON.stringify({
      id: readBack?.id,
      status: readBack?.status,
      amountPaise: readBack?.amountPaise,
      typeofAmount: typeof readBack?.amountPaise,
    }),
  );
  await client.end();
  if (!ok) process.exit(1);
}

main().catch(async (e) => {
  console.error('SMOKE FAILED:', e.message);
  try { await client.end(); } catch {}
  process.exit(1);
});

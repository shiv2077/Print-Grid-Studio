// Delete a test order by code: removes the DB row (cascades order_files) and the
// storage object(s) under <code>/. Usage: node scripts/cleanup-order.mjs PG-XXXX
import postgres from 'postgres';
import { createClient } from '@supabase/supabase-js';
import { loadEnv } from './_env.mjs';

const code = process.argv[2];
if (!code) { console.error('usage: cleanup-order.mjs <ORDER_CODE>'); process.exit(2); }
const env = loadEnv();
const sql = postgres(env.DATABASE_URL, { ssl: 'require', max: 1 });
const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const bucket = env.SUPABASE_STORAGE_BUCKET || 'order-files';

try {
  const files = await sql`select storage_path from order_files f join orders o on o.id = f.order_id where o.order_code = ${code}`;
  for (const f of files) {
    await supabase.storage.from(bucket).remove([f.storage_path]);
  }
  const del = await sql`delete from orders where order_code = ${code}`;
  console.log(`cleaned ${code}: removed ${files.length} object(s), ${del.count} order row(s)`);
  await sql.end();
} catch (e) {
  console.error('cleanup error:', e.message);
  try { await sql.end(); } catch {}
  process.exit(1);
}

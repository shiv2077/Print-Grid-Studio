// Create the PRIVATE `order-files` Storage bucket (idempotent). service_role key required.
import { createClient } from '@supabase/supabase-js';
import { loadEnv } from './_env.mjs';

const env = loadEnv();
const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});
const bucket = env.SUPABASE_STORAGE_BUCKET || 'order-files';

const { data: existing } = await supabase.storage.getBucket(bucket);
if (existing) {
  console.log(`bucket '${bucket}' already exists — public=${existing.public}`);
  process.exit(existing.public ? 1 : 0); // must be PRIVATE
}

const { data, error } = await supabase.storage.createBucket(bucket, {
  public: false,
  fileSizeLimit: '50MB', // project plan caps per-bucket size; STLs are well under this
  allowedMimeTypes: ['application/octet-stream', 'application/sla', 'model/stl', 'text/plain'],
});
if (error) {
  console.error('CREATE BUCKET FAILED:', error.message);
  process.exit(1);
}
console.log(`created PRIVATE bucket '${bucket}':`, JSON.stringify(data));

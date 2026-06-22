import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let cached: SupabaseClient | null = null;

function client(): SupabaseClient {
  if (cached) return cached;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set');
  cached = createClient(url, key, { auth: { persistSession: false } });
  return cached;
}

function bucket(): string {
  return process.env.SUPABASE_STORAGE_BUCKET || 'order-files';
}

/** Upload a model file to the PRIVATE bucket using the service_role key. */
export async function uploadModel(path: string, buffer: Buffer, contentType = 'application/octet-stream'): Promise<string> {
  const { error } = await client().storage.from(bucket()).upload(path, buffer, { contentType, upsert: false });
  if (error) throw new Error(`Storage upload failed: ${error.message}`);
  return path;
}

/** Short-lived signed URL for a private object (reads are never public). */
export async function signedUrl(path: string, expiresInSeconds = 3600): Promise<string> {
  const { data, error } = await client().storage.from(bucket()).createSignedUrl(path, expiresInSeconds);
  if (error) throw new Error(`Signed URL failed: ${error.message}`);
  return data.signedUrl;
}

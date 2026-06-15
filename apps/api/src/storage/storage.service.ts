import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class StorageService {
  private readonly client: SupabaseClient;
  private readonly bucket: string;

  constructor(config: ConfigService) {
    this.client = createClient(
      config.getOrThrow<string>('SUPABASE_URL'),
      config.getOrThrow<string>('SUPABASE_SERVICE_ROLE_KEY'),
      { auth: { persistSession: false } },
    );
    this.bucket = config.get<string>('SUPABASE_STORAGE_BUCKET') ?? 'order-files';
  }

  /** Upload an STL to the PRIVATE bucket. Uses the service_role key. */
  async uploadStl(path: string, buffer: Buffer, contentType = 'application/octet-stream'): Promise<string> {
    const { error } = await this.client.storage
      .from(this.bucket)
      .upload(path, buffer, { contentType, upsert: false });
    if (error) throw new Error(`Storage upload failed: ${error.message}`);
    return path;
  }

  /** Short-lived signed URL for a private object (reads are never public). */
  async signedUrl(path: string, expiresInSeconds = 3600): Promise<string> {
    const { data, error } = await this.client.storage
      .from(this.bucket)
      .createSignedUrl(path, expiresInSeconds);
    if (error) throw new Error(`Signed URL failed: ${error.message}`);
    return data.signedUrl;
  }

  async remove(path: string): Promise<void> {
    await this.client.storage.from(this.bucket).remove([path]);
  }
}

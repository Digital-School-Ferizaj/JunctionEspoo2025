import { supabaseAdmin } from '../supabase.js';
import { env } from '../env.js';

export async function uploadAudioBuffer(path: string, buffer: Buffer, contentType: string) {
  const { error } = await supabaseAdmin.storage.from(env.STORAGE_BUCKET).upload(path, buffer, {
    contentType,
    upsert: true,
  });
  if (error) {
    throw new Error(`Storage upload failed: ${error.message}`);
  }
  return path;
}

export async function createSignedUrl(path: string, expiresIn = 600) {
  const { data, error } = await supabaseAdmin.storage
    .from(env.STORAGE_BUCKET)
    .createSignedUrl(path, expiresIn);
  if (error || !data?.signedUrl) {
    throw new Error(error?.message ?? 'Unable to sign URL');
  }
  return data.signedUrl;
}

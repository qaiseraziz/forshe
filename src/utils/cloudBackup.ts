// v1.2.8-dev — Cloud backup helpers.
//
// Thin wrappers around `supabase.storage.from('backups')`. Every helper scopes
// access under `${userId}/` so the RLS policy on the bucket (see
// `supabase-setup.sql` at the repo root) accepts the request.
//
// The cloud stores CIPHERTEXT only — callers must pass content that has already
// been run through `encryptData()` from `src/utils/backup.ts`. Plaintext backups
// MUST NOT be uploaded. This is enforced by code review + the qa-expert ban rule.

import { supabase } from '../lib/supabase';

const BUCKET = 'backups';

export interface CloudBackupMeta {
  name: string;
  createdAt: string;
  size: number;
}

export async function uploadBackup(
  userId: string,
  fileName: string,
  content: string,
): Promise<{ ok: boolean; error?: string }> {
  const path = `${userId}/${fileName}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, content, {
    contentType: 'text/plain',
    upsert: true,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function listBackups(
  userId: string,
): Promise<{ files: CloudBackupMeta[]; error?: string }> {
  const { data, error } = await supabase.storage.from(BUCKET).list(userId, {
    limit: 100,
    sortBy: { column: 'created_at', order: 'desc' },
  });
  if (error) return { files: [], error: error.message };
  const files: CloudBackupMeta[] = (data ?? [])
    // Supabase returns a placeholder `.emptyFolderPlaceholder` for empty dirs — skip it.
    .filter(f => f.name && !f.name.startsWith('.'))
    .map(f => ({
      name: f.name,
      createdAt: f.created_at ?? f.updated_at ?? '',
      // metadata can be null on some Supabase versions — default to 0.
      size: (f.metadata && typeof f.metadata.size === 'number') ? f.metadata.size : 0,
    }));
  return { files };
}

/** Read a Blob as UTF-8 text. React Native's Blob lacks `.text()` / `.arrayBuffer()`,
 *  so we use FileReader which IS polyfilled by react-native. */
function blobToText(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === 'string') resolve(result);
      else reject(new Error('Unexpected FileReader result type.'));
    };
    reader.onerror = () => reject(reader.error ?? new Error('FileReader failed.'));
    reader.readAsText(blob);
  });
}

export async function downloadBackup(
  userId: string,
  fileName: string,
): Promise<{ content: string | null; error?: string }> {
  const path = `${userId}/${fileName}`;
  const { data, error } = await supabase.storage.from(BUCKET).download(path);
  if (error) return { content: null, error: error.message };
  if (!data) return { content: null, error: 'Empty response from storage.' };
  try {
    const text = await blobToText(data);
    return { content: text };
  } catch (e: any) {
    return { content: null, error: e?.message || 'Failed to read downloaded file.' };
  }
}

export async function deleteBackup(
  userId: string,
  fileName: string,
): Promise<{ ok: boolean; error?: string }> {
  const path = `${userId}/${fileName}`;
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

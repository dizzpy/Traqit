import { createAdminClient } from "@/lib/supabase/admin";
import { MAX_UPLOAD_BYTES, ALLOWED_UPLOAD_MIME_TYPES } from "@/lib/constants";

export const DOCUMENTS_BUCKET = "documents";

// Re-exported so route handlers only need one import; kept in sync with the
// bucket's own file_size_limit/allowed_mime_types
// (prisma/sql/create_documents_storage_bucket.sql) — checked here too so a
// rejected upload gets a clear message instead of a raw Storage API error.
export { MAX_UPLOAD_BYTES };
export const ALLOWED_MIME_TYPES = ALLOWED_UPLOAD_MIME_TYPES;

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-100);
}

/** Object path for a document upload — scoped per profile and application. */
export function documentStoragePath(
  profileId: string,
  applicationId: string,
  id: string,
  filename: string,
): string {
  return `${profileId}/${applicationId}/${id}-${sanitizeFilename(filename)}`;
}

/**
 * Uploads a file to the private documents bucket via the service-role
 * client. Throws if storage isn't configured (no service-role key) or the
 * upload itself fails — callers turn that into a 500, since a missing
 * service-role key is a deploy misconfiguration, not a user-facing error.
 */
export async function uploadDocumentFile(
  path: string,
  file: File,
): Promise<void> {
  const admin = createAdminClient();
  if (!admin)
    throw new Error("Storage is not configured (missing service-role key)");
  const { error } = await admin.storage
    .from(DOCUMENTS_BUCKET)
    .upload(path, file, {
      contentType: file.type,
      upsert: false,
    });
  if (error) throw error;
}

/** Short-lived signed URL for downloading a private document. */
export async function signDocumentUrl(
  path: string,
  expiresInSeconds = 60,
): Promise<string> {
  const admin = createAdminClient();
  if (!admin)
    throw new Error("Storage is not configured (missing service-role key)");
  const { data, error } = await admin.storage
    .from(DOCUMENTS_BUCKET)
    .createSignedUrl(path, expiresInSeconds);
  if (error || !data) throw error ?? new Error("Failed to create signed URL");
  return data.signedUrl;
}

/** Removes a document's underlying file. Never throws — deleting the DB row should still succeed even if this fails. */
export async function deleteDocumentFile(path: string): Promise<void> {
  const admin = createAdminClient();
  if (!admin) return;
  await admin.storage.from(DOCUMENTS_BUCKET).remove([path]);
}

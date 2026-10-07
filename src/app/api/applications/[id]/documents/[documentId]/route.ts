import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getProfile } from "@/lib/auth";
import { apiError } from "@/lib/utils";
import {
  deleteDocumentFile,
  documentStoragePath,
  uploadDocumentFile,
  uploadValidationError,
} from "@/lib/storage";

const updateSchema = z.object({
  name: z.string().trim().min(1).optional(),
  url: z.string().url().optional(),
  type: z.enum(["cv", "cover-letter", "portfolio", "other"]).optional(),
});

/**
 * Edits a document in place. JSON body edits label/type (and the URL, for
 * link documents). A multipart body with a `file` replaces an uploaded
 * document's file — the new file is stored before the row is touched, and
 * the old file is only removed once the row points at the new one.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; documentId: string }> },
) {
  const profile = await getProfile();
  if (!profile) return apiError("Unauthorized", "UNAUTHORIZED", 401);
  const { id, documentId } = await params;

  const app = await prisma.application.findFirst({
    where: { id, profileId: profile.id },
  });
  if (!app) return apiError("Not found", "NOT_FOUND", 404);

  const existing = await prisma.document.findFirst({
    where: { id: documentId, applicationId: id },
  });
  if (!existing) return apiError("Document not found", "NOT_FOUND", 404);

  const isMultipart = req.headers
    .get("content-type")
    ?.startsWith("multipart/form-data");

  if (!isMultipart) {
    const parsed = updateSchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success)
      return apiError(parsed.error.message, "VALIDATION_ERROR", 400);
    // An uploaded document's url is its internal download route — swapping
    // it for an arbitrary link would orphan the stored file.
    if (parsed.data.url !== undefined && existing.source !== "link") {
      return apiError(
        "Only link documents have an editable URL",
        "VALIDATION_ERROR",
        400,
      );
    }
    const doc = await prisma.document.update({
      where: { id: documentId },
      data: parsed.data,
    });
    return NextResponse.json({ data: doc });
  }

  if (existing.source !== "upload") {
    return apiError(
      "Only uploaded documents can have their file replaced",
      "VALIDATION_ERROR",
      400,
    );
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return apiError("Expected multipart/form-data", "VALIDATION_ERROR", 400);
  }
  const file = form.get("file");
  if (!(file instanceof File))
    return apiError("A file is required", "VALIDATION_ERROR", 400);

  const parsed = updateSchema.omit({ url: true }).safeParse({
    name: form.get("name") || undefined,
    type: form.get("type") || undefined,
  });
  if (!parsed.success)
    return apiError(parsed.error.message, "VALIDATION_ERROR", 400);

  const invalid = uploadValidationError(file);
  if (invalid) return apiError(invalid.message, invalid.code, 400);

  const path = documentStoragePath(
    profile.id,
    id,
    crypto.randomUUID(),
    file.name,
  );
  try {
    await uploadDocumentFile(path, file);
  } catch (err) {
    console.error(err);
    return apiError(
      "Couldn't upload the file. Try again.",
      "UPLOAD_FAILED",
      500,
    );
  }

  try {
    const doc = await prisma.document.update({
      where: { id: documentId },
      data: {
        ...parsed.data,
        storagePath: path,
        fileSize: file.size,
        mimeType: file.type,
      },
    });
    if (existing.storagePath) await deleteDocumentFile(existing.storagePath);
    return NextResponse.json({ data: doc });
  } catch (err) {
    console.error(err);
    // Row still points at the old file — drop the new one instead.
    await deleteDocumentFile(path);
    return apiError("Server error", "SERVER_ERROR", 500);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; documentId: string }> },
) {
  const profile = await getProfile();
  if (!profile) return apiError("Unauthorized", "UNAUTHORIZED", 401);
  const { id, documentId } = await params;

  const app = await prisma.application.findFirst({
    where: { id, profileId: profile.id },
  });
  if (!app) return apiError("Not found", "NOT_FOUND", 404);

  const doc = await prisma.document.findFirst({
    where: { id: documentId, applicationId: id },
  });
  if (!doc) return apiError("Document not found", "NOT_FOUND", 404);

  await prisma.document.deleteMany({
    where: { id: documentId, applicationId: id },
  });
  // Best-effort — the DB row is already gone either way; an orphaned blob in
  // a private bucket nobody can browse to isn't worth failing the delete over.
  if (doc.source === "upload" && doc.storagePath) {
    await deleteDocumentFile(doc.storagePath);
  }
  return NextResponse.json({ data: { ok: true } });
}

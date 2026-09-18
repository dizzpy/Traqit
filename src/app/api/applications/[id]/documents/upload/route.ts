import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getProfile } from "@/lib/auth";
import { apiError } from "@/lib/utils";
import {
  ALLOWED_MIME_TYPES,
  MAX_UPLOAD_BYTES,
  documentStoragePath,
  uploadDocumentFile,
  deleteDocumentFile,
} from "@/lib/storage";

const metaSchema = z.object({
  name: z.string().min(1),
  type: z.enum(["cv", "cover-letter", "portfolio", "other"]),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const profile = await getProfile();
  if (!profile) return apiError("Unauthorized", "UNAUTHORIZED", 401);
  const { id } = await params;
  const app = await prisma.application.findFirst({
    where: { id, profileId: profile.id },
  });
  if (!app) return apiError("Not found", "NOT_FOUND", 404);

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return apiError("Expected multipart/form-data", "VALIDATION_ERROR", 400);
  }

  const file = form.get("file");
  if (!(file instanceof File))
    return apiError("A file is required", "VALIDATION_ERROR", 400);

  const parsed = metaSchema.safeParse({
    name: form.get("name") || file.name,
    type: form.get("type"),
  });
  if (!parsed.success)
    return apiError(parsed.error.message, "VALIDATION_ERROR", 400);

  if (file.size > MAX_UPLOAD_BYTES) {
    return apiError(
      `File is too large (max ${(MAX_UPLOAD_BYTES / 1024 / 1024).toFixed(0)}MB)`,
      "FILE_TOO_LARGE",
      400,
    );
  }
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return apiError(
      "Unsupported file type — use PDF, DOCX, PNG or JPG",
      "UNSUPPORTED_TYPE",
      400,
    );
  }

  // Upload before creating any DB row, so a failed upload never leaves a
  // partial/orphaned document record behind.
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
    const doc = await prisma.document.create({
      data: {
        applicationId: id,
        name: parsed.data.name,
        type: parsed.data.type,
        source: "upload",
        storagePath: path,
        fileSize: file.size,
        mimeType: file.type,
        // Placeholder — replaced with the real download path once we have the id.
        url: "",
      },
    });
    const withUrl = await prisma.document.update({
      where: { id: doc.id },
      data: { url: `/api/applications/${id}/documents/${doc.id}/download` },
    });
    await prisma.activity.create({
      data: {
        applicationId: id,
        type: "document_added",
        description: `Document added: ${parsed.data.name}`,
      },
    });
    return NextResponse.json({ data: withUrl }, { status: 201 });
  } catch (err) {
    console.error(err);
    // The DB write failed — don't leave an orphaned file in storage.
    await deleteDocumentFile(path);
    return apiError("Server error", "SERVER_ERROR", 500);
  }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getProfile } from "@/lib/auth";
import { apiError } from "@/lib/utils";
import { signDocumentUrl } from "@/lib/storage";

/**
 * Stable, never-expiring path stored as an uploaded Document's `url`. Checks
 * ownership, then redirects to a freshly-minted short-lived signed URL —
 * the private bucket is never reachable without going through here.
 */
export async function GET(
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
  if (!doc || doc.source !== "upload" || !doc.storagePath) {
    return apiError("Document not found", "NOT_FOUND", 404);
  }

  try {
    const signedUrl = await signDocumentUrl(doc.storagePath);
    return NextResponse.redirect(signedUrl);
  } catch (err) {
    console.error(err);
    return apiError("Couldn't retrieve the file", "SERVER_ERROR", 500);
  }
}

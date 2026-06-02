import { mutate as globalMutate } from "swr";
import type { Contact, Document } from "@/types";

async function jsonOrThrow(res: Response, fallback: string) {
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error?.message ?? fallback);
  return json.data;
}

/** Revalidate every applications key so nested contacts/documents/activity refresh. */
export const revalidateApps = () =>
  globalMutate((key) => typeof key === "string" && key.startsWith("/api/applications"));

export type ContactInput = {
  name: string;
  role: string;
  email?: string | null;
  phone?: string | null;
  linkedinUrl?: string | null;
  stageName?: string | null;
  notes?: string | null;
};

export async function createContact(appId: string, body: ContactInput): Promise<Contact> {
  const res = await fetch(`/api/applications/${appId}/contacts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return jsonOrThrow(res, "Failed to add contact");
}

export async function deleteContact(appId: string, contactId: string): Promise<void> {
  const res = await fetch(`/api/applications/${appId}/contacts/${contactId}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete contact");
}

export type DocumentInput = {
  name: string;
  url: string;
  type: "cv" | "cover-letter" | "portfolio" | "other";
};

export async function createDocument(appId: string, body: DocumentInput): Promise<Document> {
  const res = await fetch(`/api/applications/${appId}/documents`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return jsonOrThrow(res, "Failed to add document");
}

export async function deleteDocument(appId: string, documentId: string): Promise<void> {
  const res = await fetch(`/api/applications/${appId}/documents/${documentId}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete document");
}

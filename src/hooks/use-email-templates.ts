import useSWR from "swr";
import type { EmailTemplate } from "@/types";

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error("Fetch error");
    return r.json();
  });

export function useEmailTemplates() {
  const { data, error, isLoading, mutate } = useSWR<{ data: EmailTemplate[] }>(
    "/api/templates/email",
    fetcher
  );
  return { templates: data?.data ?? [], isLoading, error, mutate };
}

export function useProfileName() {
  // Shares the "/api/profile" key with useProfile — keep the same dedup config
  // so the two callers don't trigger competing revalidations.
  const { data } = useSWR<{ data: { id: string; name: string } }>("/api/profile", fetcher, {
    dedupingInterval: 60_000,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });
  return data?.data?.name ?? "";
}

interface EmailTemplatePayload {
  name: string;
  subject: string;
  body: string;
  category: string;
}

export async function saveEmailTemplate(payload: EmailTemplatePayload) {
  const res = await fetch("/api/templates/email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to save template");
  return res.json();
}

export async function updateEmailTemplate(id: string, payload: Partial<EmailTemplatePayload>) {
  const res = await fetch(`/api/templates/email/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to update template");
  return res.json();
}

export async function deleteEmailTemplate(id: string) {
  const res = await fetch(`/api/templates/email/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete template");
  return res.json();
}

export async function reorderEmailTemplates(orderedIds: string[]) {
  const res = await fetch("/api/templates/email/reorder", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ orderedIds }),
  });
  if (!res.ok) throw new Error("Failed to reorder templates");
  return res.json();
}

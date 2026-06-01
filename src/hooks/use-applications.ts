import useSWR, { mutate as globalMutate } from "swr";
import type { Application, ApplicationStatus } from "@/types";

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error("Fetch error");
    return r.json();
  });

interface UseApplicationsOptions {
  status?: ApplicationStatus | ApplicationStatus[];
  page?: number;
  limit?: number;
}

export function useApplications(opts: UseApplicationsOptions = {}) {
  const params = new URLSearchParams();
  if (opts.status) {
    const statuses = Array.isArray(opts.status) ? opts.status : [opts.status];
    params.set("status", statuses.join(","));
  }
  if (opts.page) params.set("page", String(opts.page));
  if (opts.limit) params.set("limit", String(opts.limit));

  const url = `/api/applications?${params.toString()}`;
  const { data, error, isLoading, mutate } = useSWR<{ data: Application[]; total: number }>(url, fetcher);

  return {
    applications: data?.data ?? [],
    total: data?.total ?? 0,
    isLoading,
    error,
    /** Bound SWR mutate for THIS key — pass optimistic data for instant UI. */
    mutate,
    /** Invalidate every `/api/applications*` key (use after writes that touch nested data). */
    revalidateAll: () =>
      globalMutate((key) => typeof key === "string" && key.startsWith("/api/applications")),
  };
}

/** Trimmed application shape returned by /api/applications/search (pickers). */
export interface ComposeApplication {
  id: string;
  companyName: string;
  position: string;
  jobPostUrl: string | null;
  status: ApplicationStatus;
  contacts: { id: string; name: string; email: string | null; role: string }[];
}

/**
 * Lightweight application list for the email-template compose/preview pickers.
 * Replaces the old `useApplications({ limit: 1000 })` heavy fetch.
 */
export function useComposeApplications() {
  const { data, error, isLoading } = useSWR<{ data: ComposeApplication[] }>(
    "/api/applications/search",
    fetcher,
    { revalidateOnFocus: false }
  );
  return { applications: data?.data ?? [], isLoading, error };
}

export function useApplication(id: string | null) {
  const { data, error, isLoading, mutate } = useSWR<{ data: Application }>(
    id ? `/api/applications/${id}` : null,
    fetcher
  );
  return { application: data?.data ?? null, isLoading, error, mutate };
}

export async function createApplication(body: Record<string, unknown>) {
  const res = await fetch("/api/applications", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error?.message ?? "Failed to create");
  return json.data as Application;
}

export async function updateApplication(id: string, body: Record<string, unknown>) {
  const res = await fetch(`/api/applications/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error?.message ?? "Failed to update");
  return json.data as Application;
}

export async function deleteApplication(id: string) {
  const res = await fetch(`/api/applications/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete");
}

import useSWR, { mutate as globalMutate } from "swr";
import type { Application, ApplicationStatus, WorkMode } from "@/types";
import { tempId } from "@/lib/optimistic";

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

/**
 * Trash many applications in ONE request + one DB write. Replaces the old
 * `Promise.all(ids.map(deleteApplication))`, which fired N requests, hit the
 * write rate-limiter and failed partially.
 */
export async function bulkDeleteApplications(ids: string[]) {
  const res = await fetch("/api/applications/bulk", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids }),
  });
  if (!res.ok) throw new Error("Failed to delete");
  return res.json();
}

/** Restore trashed applications (used by the Undo toast + the Trash page). */
export async function restoreApplications(ids: string[]) {
  const res = await fetch("/api/trash/restore", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "application", ids }),
  });
  if (!res.ok) throw new Error("Failed to restore");
  return res.json();
}

/**
 * Build a fully-shaped placeholder Application from form fields, with a temp id,
 * for instant optimistic insertion. Reconcile by replacing it with the server
 * record once the POST resolves.
 */
export function optimisticApplication(fields: Record<string, unknown>): Application {
  const now = new Date().toISOString();
  const str = (v: unknown) => (v == null ? null : String(v));
  return {
    id: tempId(),
    profileId: "",
    companyName: String(fields.companyName ?? ""),
    companyUrl: str(fields.companyUrl),
    position: String(fields.position ?? ""),
    jobPostUrl: str(fields.jobPostUrl),
    jobType: String(fields.jobType ?? ""),
    workMode: (fields.workMode as WorkMode) ?? "no-data",
    appliedVia: String(fields.appliedVia ?? ""),
    salaryMin: (fields.salaryMin as number | null) ?? null,
    salaryMax: (fields.salaryMax as number | null) ?? null,
    currency: String(fields.currency ?? "LKR"),
    location: str(fields.location),
    status: (fields.status as ApplicationStatus) ?? "APPLIED",
    appliedDate: str(fields.appliedDate),
    firstResponseDate: null,
    deadline: str(fields.deadline),
    notes: str(fields.notes),
    stages: [],
    contacts: [],
    documents: [],
    activityLog: [],
    createdAt: now,
    updatedAt: now,
  };
}

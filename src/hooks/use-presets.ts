import useSWR from "swr";
import type { Source, JobType, PipelineTemplate } from "@/types";

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error("Fetch error");
    return r.json();
  });

export function useSources() {
  const { data, error, isLoading, mutate } = useSWR<{ data: Source[] }>("/api/presets/sources", fetcher);
  return { sources: data?.data?.map((s) => s.name) ?? [], raw: data?.data ?? [], isLoading, error, mutate };
}

export function useJobTypes() {
  const { data, error, isLoading, mutate } = useSWR<{ data: JobType[] }>("/api/presets/job-types", fetcher);
  return { jobTypes: data?.data?.map((t) => t.name) ?? [], raw: data?.data ?? [], isLoading, error, mutate };
}

export function useTemplates() {
  const { data, error, isLoading, mutate } = useSWR<{ data: PipelineTemplate[] }>("/api/presets/templates", fetcher);
  return { templates: data?.data ?? [], isLoading, error, mutate };
}

export async function addSource(name: string) {
  const res = await fetch("/api/presets/sources", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  return res.json();
}

export async function addJobType(name: string) {
  const res = await fetch("/api/presets/job-types", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  return res.json();
}

export async function deleteSource(id: string) {
  const res = await fetch(`/api/presets/sources/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete source");
  return res.json();
}

export async function deleteJobType(id: string) {
  const res = await fetch(`/api/presets/job-types/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete job type");
  return res.json();
}

export async function saveTemplate(payload: { name: string; stages: string[]; isDefault?: boolean }) {
  const res = await fetch("/api/presets/templates", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to save template");
  return res.json();
}

export async function updateTemplate(
  id: string,
  patch: { name?: string; stages?: string[]; isDefault?: boolean }
) {
  const res = await fetch(`/api/presets/templates/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error("Failed to update template");
  return res.json();
}

export async function deleteTemplate(id: string) {
  const res = await fetch(`/api/presets/templates/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete template");
  return res.json();
}

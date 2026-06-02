import type { PipelineStage } from "@/types";

async function jsonOrThrow(res: Response, fallback: string) {
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error?.message ?? fallback);
  return json.data;
}

/** Create a pipeline stage on an application. `order` is 1-based per the API. */
export async function createStage(
  appId: string,
  body: { name: string; order: number; status?: string; scheduledDate?: string | null; notes?: string | null }
): Promise<PipelineStage> {
  const res = await fetch(`/api/applications/${appId}/stages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return jsonOrThrow(res, "Failed to add stage");
}

export async function updateStage(
  appId: string,
  stageId: string,
  patch: Partial<Pick<PipelineStage, "name" | "status" | "scheduledDate" | "completedDate" | "notes">>
): Promise<PipelineStage> {
  const res = await fetch(`/api/applications/${appId}/stages/${stageId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  return jsonOrThrow(res, "Failed to update stage");
}

export async function deleteStage(appId: string, stageId: string): Promise<void> {
  const res = await fetch(`/api/applications/${appId}/stages/${stageId}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete stage");
}

/** Persist a new stage order. `orderedIds` is the full list of stage ids, top→bottom. */
export async function reorderStages(appId: string, orderedIds: string[]): Promise<void> {
  const res = await fetch(`/api/applications/${appId}/stages/reorder`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ orderedIds }),
  });
  if (!res.ok) throw new Error("Failed to reorder stages");
}

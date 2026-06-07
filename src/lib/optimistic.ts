import { toast } from "sonner";

/**
 * Toast with a 5-second Undo action — the standard feedback after a destructive
 * optimistic action (delete / bulk delete / move to trash). The UI has already
 * updated; `onUndo` reverses both the server state and the local cache.
 */
export function toastUndo(message: string, onUndo: () => void, opts?: { duration?: number }) {
  toast(message, {
    duration: opts?.duration ?? 5000,
    action: { label: "Undo", onClick: onUndo },
  });
}

/** Stable client-side id for an optimistic row, distinguishable from a cuid. */
export function tempId(prefix = "temp"): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/** True for ids minted by {@link tempId} — i.e. rows not yet persisted. */
export function isTempId(id: string): boolean {
  return id.startsWith("temp_");
}

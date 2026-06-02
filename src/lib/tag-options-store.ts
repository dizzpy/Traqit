"use client";

import { useSyncExternalStore } from "react";
import { DEFAULT_JOB_TYPES, DEFAULT_SOURCES } from "@/lib/constants";
import { tagBadgeClass } from "@/lib/tag-colors";

export interface TagOption {
  value: string;
  label: string;
  className?: string;
}

function mk(names: string[]): TagOption[] {
  return names.map((n) => ({ value: n, label: n, className: tagBadgeClass(n) }));
}

/**
 * Session-only store for the managed Type / Source tag option lists, shared
 * across the table pickers and the detail panel so create/reorder/delete stay
 * in sync. Resets on reload (static prototype — wires to presets API in Sprint 3).
 */
let typeOptions = mk(DEFAULT_JOB_TYPES);
let sourceOptions = mk(DEFAULT_SOURCES);

const listeners = new Set<() => void>();
function emit() { listeners.forEach((l) => l()); }
function subscribe(l: () => void) { listeners.add(l); return () => { listeners.delete(l); }; }

export function setTypeOptions(o: TagOption[]) { typeOptions = o; emit(); }
export function setSourceOptions(o: TagOption[]) { sourceOptions = o; emit(); }

export function useTypeOptions() {
  return useSyncExternalStore(subscribe, () => typeOptions, () => typeOptions);
}
export function useSourceOptions() {
  return useSyncExternalStore(subscribe, () => sourceOptions, () => sourceOptions);
}

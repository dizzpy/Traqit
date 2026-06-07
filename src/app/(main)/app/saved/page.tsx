"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BookmarkIcon,
  Search01Icon,
  ArrowUpRight01Icon,
  Delete02Icon,
  CheckmarkCircle01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { SaveJobModal } from "@/components/application/save-job-modal";
import { AddApplicationPanel } from "@/components/application/add-application-modal";
import { ApplicationDetail } from "@/components/application/application-detail";
import {
  useApplications,
  createApplication,
  updateApplication,
  deleteApplication,
  restoreApplications,
  optimisticApplication,
} from "@/hooks/use-applications";
import { toastUndo } from "@/lib/optimistic";
import { cn, deadlineBadge, hostnameOf, formatRelativeDate } from "@/lib/utils";
import { consumePendingAction } from "@/lib/pending-action";
import { useShortcutHints } from "@/hooks/use-shortcut-hints";
import { Kbd } from "@/components/ui/kbd";
import type { Application } from "@/types";

type SortKey = "recent" | "deadline";

export default function SavedPage() {
  const { applications: saved, total, isLoading, mutate } = useApplications({ status: "SAVED" });

  const [showSave, setShowSave] = useState(false);
  const [promoteTarget, setPromoteTarget] = useState<Application | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Application | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("recent");
  const [showHints] = useShortcutHints();

  // "b" shortcut → open the Save job modal (from here or after navigating in).
  useEffect(() => {
    const open = () => setShowSave(true);
    window.addEventListener("app:save-job", open);
    if (consumePendingAction("save-job")) open();
    return () => window.removeEventListener("app:save-job", open);
  }, []);

  const selectedApp = saved.find((a) => a.id === selectedId) ?? null;

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = saved;
    if (q) {
      list = list.filter(
        (a) => a.companyName.toLowerCase().includes(q) || a.position.toLowerCase().includes(q)
      );
    }
    return [...list].sort((a, b) => {
      if (sort === "deadline") {
        const ad = a.deadline ? new Date(a.deadline).getTime() : Infinity;
        const bd = b.deadline ? new Date(b.deadline).getTime() : Infinity;
        return ad - bd;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [saved, query, sort]);

  // Save a job: show the card instantly, then reconcile with the server record.
  async function createSaved(fields: Record<string, unknown>) {
    const temp = optimisticApplication(fields);
    mutate((cur) => (cur ? { data: [temp, ...cur.data], total: cur.total + 1 } : cur), { revalidate: false });
    try {
      const created = await createApplication(fields);
      mutate((cur) => (cur ? { ...cur, data: cur.data.map((a) => (a.id === temp.id ? created : a)) } : cur), { revalidate: false });
    } catch {
      mutate((cur) => (cur ? { data: cur.data.filter((a) => a.id !== temp.id), total: Math.max(0, cur.total - 1) } : cur), { revalidate: false });
      toast.error("Couldn't save the job");
    }
  }

  // Promote a saved job → APPLIED. It leaves the SAVED list immediately.
  async function promoteApplied(fields: Record<string, unknown>) {
    if (!promoteTarget) return;
    const id = promoteTarget.id;
    mutate((cur) => (cur ? { data: cur.data.filter((a) => a.id !== id), total: Math.max(0, cur.total - 1) } : cur), { revalidate: false });
    try {
      await updateApplication(id, { ...fields, status: "APPLIED" });
      toast.success("Marked as applied");
    } catch {
      toast.error("Couldn't mark as applied");
      mutate();
    }
  }

  async function removeSaved(app: Application) {
    mutate({ data: saved.filter((x) => x.id !== app.id), total: Math.max(0, total - 1) }, { revalidate: false });
    if (selectedId === app.id) setSelectedId(null);
    try {
      await deleteApplication(app.id);
      toastUndo("Saved job removed", async () => {
        try { await restoreApplications([app.id]); mutate(); } catch { toast.error("Couldn't restore"); }
      });
    } catch {
      toast.error("Couldn't delete saved job");
      mutate();
    }
  }

  async function updateSaved(id: string, patch: Partial<Application>) {
    mutate({ data: saved.map((x) => (x.id === id ? { ...x, ...patch } : x)), total }, { revalidate: false });
    try {
      await updateApplication(id, patch as Record<string, unknown>);
      mutate();
    } catch {
      toast.error("Couldn't update");
      mutate();
    }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-bg shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold text-text-primary" style={{ fontFamily: "var(--font-family-display)" }}>
            Saved jobs
          </h1>
          <span className="text-xs text-text-muted bg-surface-elevated border border-border px-2 py-0.5 rounded-full">
            {saved.length}
          </span>
        </div>
        <Button
          size="sm"
          onClick={() => setShowSave(true)}
          className="h-9 px-4 text-sm font-semibold shadow-sm shadow-accent/25"
        >
          <HugeiconsIcon icon={BookmarkIcon} size={14} strokeWidth={1.5} />
          Save job
          {showHints && <Kbd className="ml-1 border-white/25 bg-white/10 text-white/90">b</Kbd>}
        </Button>
      </div>

      {/* Toolbar */}
      {saved.length > 0 && (
        <div className="flex items-center justify-between gap-4 px-6 py-3 border-b border-border shrink-0">
          <div className="relative w-full max-w-xs">
            <HugeiconsIcon
              icon={Search01Icon}
              size={14}
              strokeWidth={1.5}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
            />
            <input
              data-search="true"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search saved jobs…"
              className="h-9 w-full rounded-input bg-surface-elevated border border-border pl-8 pr-9 text-sm text-text-primary placeholder:text-text-muted transition-colors duration-150 focus:outline-none focus:border-border-hover"
            />
            {!query && showHints && (
              <Kbd className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">/</Kbd>
            )}
          </div>
          <div className="w-44 shrink-0">
            <Select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              options={[
                { value: "recent", label: "Recently added" },
                { value: "deadline", label: "Deadline" },
              ]}
            />
          </div>
        </div>
      )}

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-6">
        {isLoading ? null : saved.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center gap-3 py-16">
            <div className="w-12 h-12 rounded-full bg-accent-soft flex items-center justify-center mb-1">
              <HugeiconsIcon icon={BookmarkIcon} size={20} className="text-accent-soft-fg" strokeWidth={1.5} />
            </div>
            <p className="text-sm font-medium text-text-primary">Nothing saved yet</p>
            <p className="text-xs text-text-muted max-w-xs">Add a posting when you spot one — it&apos;ll wait here until you&apos;re ready to apply.</p>
            <Button variant="outline" size="sm" className="mt-2" onClick={() => setShowSave(true)}>
              <HugeiconsIcon icon={BookmarkIcon} size={13} strokeWidth={1.5} /> Save a job
            </Button>
          </div>
        ) : visible.length === 0 ? (
          <p className="text-sm text-text-muted text-center py-12">No saved jobs match your search.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {visible.map((app) => (
              <SavedJobCard
                key={app.id}
                app={app}
                onOpen={() => setSelectedId(app.id)}
                onPromote={() => setPromoteTarget(app)}
                onDelete={() => setDeleteTarget(app)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Panels */}
      {selectedApp && (
        <ApplicationDetail
          application={selectedApp}
          onUpdate={(patch) => updateSaved(selectedApp.id, patch)}
          onDelete={() => removeSaved(selectedApp)}
          onClose={() => setSelectedId(null)}
        />
      )}
      {showSave && <SaveJobModal onClose={() => setShowSave(false)} onSubmit={createSaved} />}
      {promoteTarget && (
        <AddApplicationPanel
          promote={promoteTarget}
          onClose={() => setPromoteTarget(null)}
          onSubmit={promoteApplied}
        />
      )}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && removeSaved(deleteTarget)}
        title="Delete this saved job?"
        message={deleteTarget ? `"${deleteTarget.companyName || hostnameOf(deleteTarget.jobPostUrl) || "This posting"}" will be removed from your saved list.` : ""}
        confirmLabel="Delete"
        tone="danger"
        icon={Delete02Icon}
      />
    </div>
  );
}

interface SavedJobCardProps {
  app: Application;
  onOpen: () => void;
  onPromote: () => void;
  onDelete: () => void;
}

function SavedJobCard({ app, onOpen, onPromote, onDelete }: SavedJobCardProps) {
  const company = app.companyName?.trim() || hostnameOf(app.jobPostUrl) || "Unknown company";
  const badge = deadlineBadge(app.deadline);

  return (
    <div
      onClick={onOpen}
      className="group relative flex flex-col gap-3 rounded-card border border-dashed border-border bg-surface-elevated/40 p-4 cursor-pointer transition-colors duration-150 hover:border-border-hover hover:bg-surface-elevated"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-medium text-text-primary truncate">{company}</p>
          <p className="text-xs text-text-muted truncate mt-0.5">{app.position || "—"}</p>
        </div>
        {badge && (
          <span className={cn("text-[11px] px-2 py-0.5 rounded-full font-medium shrink-0", badge.className)}>
            {badge.label}
          </span>
        )}
      </div>

      {app.notes && <p className="text-xs text-text-secondary line-clamp-2">{app.notes}</p>}

      <div className="flex items-center justify-between gap-2 mt-auto pt-1">
        <span className="text-[11px] text-text-muted">Saved {formatRelativeDate(app.createdAt)}</span>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
          {app.jobPostUrl && (
            <a
              href={app.jobPostUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              title="Open posting"
              className="text-text-muted hover:text-accent transition-colors p-1"
            >
              <HugeiconsIcon icon={ArrowUpRight01Icon} size={14} strokeWidth={1.5} />
            </a>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            title="Delete saved job"
            className="text-text-muted hover:text-[var(--status-rejected-fg)] transition-colors p-1"
          >
            <HugeiconsIcon icon={Delete02Icon} size={14} strokeWidth={1.5} />
          </button>
        </div>
      </div>

      <Button
        size="sm"
        className="w-full"
        onClick={(e) => {
          e.stopPropagation();
          onPromote();
        }}
      >
        <HugeiconsIcon icon={CheckmarkCircle01Icon} size={13} strokeWidth={1.5} /> Mark as applied
      </Button>
    </div>
  );
}

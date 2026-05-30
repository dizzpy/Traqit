"use client";

import { useState } from "react";
import { differenceInDays } from "date-fns";
import { BookmarkIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SaveJobModalProps {
  onClose: () => void;
}

function deadlineBadge(deadline: string): { label: string; className: string } | null {
  if (!deadline) return null;
  const days = differenceInDays(new Date(deadline), new Date());
  if (days < 0) return { label: "Expired", className: "text-[var(--status-rejected-fg)] bg-[var(--status-rejected-bg)]" };
  if (days <= 2) return { label: `${days}d left`, className: "text-[#f59e0b] bg-[#2d1f08]" };
  return { label: `${days} days left`, className: "text-text-muted bg-surface-elevated border border-border" };
}

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="text-xs font-medium text-text-secondary">
      {children}
      {required && <span className="text-[var(--status-rejected-fg)] ml-0.5">*</span>}
    </label>
  );
}

export function SaveJobModal({ onClose }: SaveJobModalProps) {
  const [url, setUrl] = useState("");
  const [company, setCompany] = useState("");
  const [position, setPosition] = useState("");
  const [note, setNote] = useState("");
  const [deadline, setDeadline] = useState("");
  const [urlError, setUrlError] = useState("");

  const badge = deadline ? deadlineBadge(deadline) : null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) { setUrlError("Job posting URL is required"); return; }
    setUrlError("");
    // Static — no API call in Sprint 1
    onClose();
  }

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="bg-surface border border-border rounded-[var(--radius-modal)] p-0 max-w-sm overflow-hidden">
        <DialogHeader className="px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-accent-soft flex items-center justify-center">
              <HugeiconsIcon icon={BookmarkIcon} size={13} className="text-accent-soft-fg" strokeWidth={1.5} />
            </div>
            <DialogTitle
              className="text-sm font-semibold text-text-primary"
              style={{ fontFamily: "var(--font-family-display)" }}
            >
              Save job for later
            </DialogTitle>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="px-5 py-4 flex flex-col gap-3">
          {/* URL — required */}
          <div className="flex flex-col gap-1.5">
            <Label required>Job posting URL</Label>
            <input
              type="url"
              value={url}
              onChange={(e) => { setUrl(e.target.value); if (e.target.value) setUrlError(""); }}
              placeholder="https://roosterjob.com/…"
              autoFocus
              className={cn(
                "h-9 w-full rounded-input bg-surface-elevated border border-border px-3 text-sm text-text-primary placeholder:text-text-muted transition-colors duration-150 focus:outline-none focus:border-border-hover",
                urlError && "border-[var(--status-rejected-fg)]"
              )}
            />
            {urlError && <p className="text-[11px] text-[var(--status-rejected-fg)]">{urlError}</p>}
          </div>

          {/* Company */}
          <div className="flex flex-col gap-1.5">
            <Label>Company</Label>
            <input
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="e.g. Dialog Axiata"
              className="h-9 w-full rounded-input bg-surface-elevated border border-border px-3 text-sm text-text-primary placeholder:text-text-muted transition-colors duration-150 focus:outline-none focus:border-border-hover"
            />
          </div>

          {/* Position */}
          <div className="flex flex-col gap-1.5">
            <Label>Position</Label>
            <input
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              placeholder="e.g. Flutter Intern"
              className="h-9 w-full rounded-input bg-surface-elevated border border-border px-3 text-sm text-text-primary placeholder:text-text-muted transition-colors duration-150 focus:outline-none focus:border-border-hover"
            />
          </div>

          {/* Note */}
          <div className="flex flex-col gap-1.5">
            <Label>Note</Label>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Any quick note…"
              className="h-9 w-full rounded-input bg-surface-elevated border border-border px-3 text-sm text-text-primary placeholder:text-text-muted transition-colors duration-150 focus:outline-none focus:border-border-hover"
            />
          </div>

          {/* Deadline */}
          <div className="flex flex-col gap-1.5">
            <Label>Application deadline</Label>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="flex-1 h-9 rounded-input bg-surface-elevated border border-border px-3 text-sm text-text-primary transition-colors duration-150 focus:outline-none focus:border-border-hover"
              />
              {badge && (
                <span className={cn("text-xs px-2 py-1 rounded-full font-medium", badge.className)}>
                  {badge.label}
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" size="sm">
              <HugeiconsIcon icon={BookmarkIcon} size={13} strokeWidth={1.5} />
              Save job
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

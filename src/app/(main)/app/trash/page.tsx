"use client";

import { useState } from "react";
import {
  Delete02Icon,
  ArrowTurnBackwardIcon,
  Mailbox01Icon,
  LayoutGridIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useTrash, purgeTrash } from "@/hooks/use-trash";
import { restoreApplications } from "@/hooks/use-applications";
import { restoreEmailTemplates } from "@/hooks/use-email-templates";

const RETENTION_DAYS = 30;

/** Whole days until a trashed item is auto-purged. */
function daysLeft(deletedAt: string): number {
  const purgeAt = new Date(deletedAt).getTime() + RETENTION_DAYS * 86_400_000;
  return Math.max(0, Math.ceil((purgeAt - Date.now()) / 86_400_000));
}

type ForeverTarget =
  | { scope: "application" | "emailTemplate"; ids?: string[]; label: string }
  | null;

export default function TrashPage() {
  const { applications, emailTemplates, counts, isLoading, mutate } = useTrash();
  const [forever, setForever] = useState<ForeverTarget>(null);

  // ---- restore (optimistic) ----
  async function restoreApp(id: string) {
    mutate((cur) => (cur ? { ...cur, data: { ...cur.data, applications: cur.data.applications.filter((a) => a.id !== id), counts: { ...cur.data.counts, applications: cur.data.counts.applications - 1 } } } : cur), { revalidate: false });
    try {
      await restoreApplications([id]);
      toast.success("Application restored");
    } catch {
      toast.error("Couldn't restore");
      mutate();
    }
  }
  async function restoreTemplate(id: string) {
    mutate((cur) => (cur ? { ...cur, data: { ...cur.data, emailTemplates: cur.data.emailTemplates.filter((t) => t.id !== id), counts: { ...cur.data.counts, emailTemplates: cur.data.counts.emailTemplates - 1 } } } : cur), { revalidate: false });
    try {
      await restoreEmailTemplates([id]);
      toast.success("Template restored");
    } catch {
      toast.error("Couldn't restore — a live item may already use that name.");
      mutate();
    }
  }

  // ---- permanent delete (optimistic) ----
  async function purgeNow(t: NonNullable<ForeverTarget>) {
    // Optimistically drop the affected rows.
    mutate((cur) => {
      if (!cur) return cur;
      const d = cur.data;
      if (t.scope === "application") {
        const apps = t.ids ? d.applications.filter((a) => !t.ids!.includes(a.id)) : [];
        return { ...cur, data: { ...d, applications: apps, counts: { ...d.counts, applications: apps.length } } };
      }
      const tpls = t.ids ? d.emailTemplates.filter((x) => !t.ids!.includes(x.id)) : [];
      return { ...cur, data: { ...d, emailTemplates: tpls, counts: { ...d.counts, emailTemplates: tpls.length } } };
    }, { revalidate: false });
    try {
      await purgeTrash(t.scope, t.ids);
    } catch {
      toast.error("Couldn't delete permanently");
      mutate();
    }
  }

  const isEmpty = !isLoading && counts.applications === 0 && counts.emailTemplates === 0;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-bg shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold text-text-primary" style={{ fontFamily: "var(--font-family-display)" }}>
            Trash
          </h1>
          <span className="text-xs text-text-muted bg-surface-elevated border border-border px-2 py-0.5 rounded-full">
            {counts.applications + counts.emailTemplates}
          </span>
        </div>
        <p className="text-xs text-text-muted">Items are permanently deleted after {RETENTION_DAYS} days.</p>
      </div>

      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-8">
        {isEmpty ? (
          <div className="h-full flex flex-col items-center justify-center text-center gap-3 py-16">
            <div className="w-12 h-12 rounded-full bg-accent-soft flex items-center justify-center mb-1">
              <HugeiconsIcon icon={Delete02Icon} size={20} className="text-accent-soft-fg" strokeWidth={1.5} />
            </div>
            <p className="text-sm font-medium text-text-primary">Trash is empty</p>
            <p className="text-xs text-text-muted max-w-xs">Deleted applications and templates land here, recoverable for 30 days.</p>
          </div>
        ) : (
          <>
            {/* Applications */}
            <TrashSection
              icon={LayoutGridIcon}
              title="Applications"
              count={counts.applications}
              onEmpty={counts.applications > 0 ? () => setForever({ scope: "application", label: `all ${counts.applications} trashed applications` }) : undefined}
            >
              {applications.map((a) => (
                <TrashRow
                  key={a.id}
                  title={a.companyName || "Untitled"}
                  subtitle={a.position || a.status}
                  days={daysLeft(a.deletedAt)}
                  onRestore={() => restoreApp(a.id)}
                  onDelete={() => setForever({ scope: "application", ids: [a.id], label: `"${a.companyName || "this application"}"` })}
                />
              ))}
            </TrashSection>

            {/* Email templates */}
            <TrashSection
              icon={Mailbox01Icon}
              title="Email templates"
              count={counts.emailTemplates}
              onEmpty={counts.emailTemplates > 0 ? () => setForever({ scope: "emailTemplate", label: `all ${counts.emailTemplates} trashed templates` }) : undefined}
            >
              {emailTemplates.map((t) => (
                <TrashRow
                  key={t.id}
                  title={t.name}
                  subtitle={t.subject}
                  days={daysLeft(t.deletedAt)}
                  onRestore={() => restoreTemplate(t.id)}
                  onDelete={() => setForever({ scope: "emailTemplate", ids: [t.id], label: `"${t.name}"` })}
                />
              ))}
            </TrashSection>
          </>
        )}
      </div>

      <ConfirmDialog
        open={!!forever}
        onClose={() => setForever(null)}
        onConfirm={() => forever && purgeNow(forever)}
        title="Delete permanently?"
        message={forever ? `${forever.label} will be deleted forever. This can't be undone.` : ""}
        confirmLabel="Delete forever"
        tone="danger"
        icon={Delete02Icon}
      />
    </div>
  );
}

function TrashSection({
  icon,
  title,
  count,
  onEmpty,
  children,
}: {
  icon: typeof Delete02Icon;
  title: string;
  count: number;
  onEmpty?: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HugeiconsIcon icon={icon} size={16} strokeWidth={1.5} className="text-text-muted" />
          <h2 className="text-sm font-semibold text-text-primary">{title}</h2>
          <span className="text-xs text-text-muted bg-surface-elevated border border-border px-2 py-0.5 rounded-full">{count}</span>
        </div>
        {onEmpty && (
          <button onClick={onEmpty} className="text-xs text-text-muted hover:text-[var(--status-rejected-fg)] transition-colors">
            Empty
          </button>
        )}
      </div>
      {count === 0 ? (
        <p className="text-xs text-text-muted px-1 py-3">Nothing here.</p>
      ) : (
        <div className="flex flex-col gap-2">{children}</div>
      )}
    </section>
  );
}

function TrashRow({
  title,
  subtitle,
  days,
  onRestore,
  onDelete,
}: {
  title: string;
  subtitle: string;
  days: number;
  onRestore: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="group flex items-center gap-3 rounded-card border border-border bg-surface-elevated/50 px-4 py-3 transition-colors duration-150 hover:bg-surface-elevated">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-text-primary truncate">{title}</p>
        <p className="text-xs text-text-muted truncate mt-0.5">{subtitle}</p>
      </div>
      <span className="text-[11px] text-text-muted shrink-0">
        {days === 0 ? "deletes today" : `${days}d left`}
      </span>
      <div className="flex items-center gap-1 shrink-0">
        <Button variant="outline" size="sm" onClick={onRestore}>
          <HugeiconsIcon icon={ArrowTurnBackwardIcon} size={13} strokeWidth={1.5} /> Restore
        </Button>
        <button
          onClick={onDelete}
          title="Delete forever"
          className="text-text-muted hover:text-[var(--status-rejected-fg)] transition-colors p-1.5"
        >
          <HugeiconsIcon icon={Delete02Icon} size={15} strokeWidth={1.5} />
        </button>
      </div>
    </div>
  );
}

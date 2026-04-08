"use client";

import { useState } from "react";
import { Share01Icon, ArrowUp01Icon, ArrowDown01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Header } from "@/components/layout/header";
import { AddApplicationModal } from "@/components/application/add-application-modal";
import { ApplicationDetail } from "@/components/application/application-detail";
import { StatusBadge, WorkModeBadge } from "@/components/ui/badge";
import { useApplications } from "@/hooks/use-applications";
import { formatDate } from "@/lib/utils";
import type { Application } from "@/types";

type SortKey = "companyName" | "position" | "status" | "appliedDate" | "createdAt";

export default function ListPage() {
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<SortKey>("createdAt");
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const [addOpen, setAddOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { applications, total, isLoading } = useApplications({ page, limit: 25 });
  const totalPages = Math.ceil(total / 25);

  function handleSort(key: SortKey) {
    if (sort === key) {
      setOrder((o) => (o === "asc" ? "desc" : "asc"));
    } else {
      setSort(key);
      setOrder("asc");
    }
  }

  const sorted = [...applications].sort((a, b) => {
    const aVal = a[sort] ?? "";
    const bVal = b[sort] ?? "";
    const cmp = String(aVal).localeCompare(String(bVal));
    return order === "asc" ? cmp : -cmp;
  });

  function SortIcon({ col }: { col: SortKey }) {
    if (sort !== col) return null;
    return (
      <HugeiconsIcon
        icon={order === "asc" ? ArrowUp01Icon : ArrowDown01Icon}
        size={12}
        strokeWidth={1.5}
      />
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header title="Applications" onAdd={() => setAddOpen(true)} />

      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-32 text-text-muted text-sm">Loading...</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-bg border-b border-border">
              <tr>
                {([
                  ["companyName", "Company"],
                  ["position", "Position"],
                  ["status", "Status"],
                  ["appliedDate", "Applied"],
                ] as [SortKey, string][]).map(([key, label]) => (
                  <th
                    key={key}
                    onClick={() => handleSort(key)}
                    className="text-left px-4 py-3 text-xs font-medium text-text-muted cursor-pointer hover:text-text-secondary select-none"
                  >
                    <span className="flex items-center gap-1">{label}<SortIcon col={key} /></span>
                  </th>
                ))}
                <th className="text-left px-4 py-3 text-xs font-medium text-text-muted">Work Mode</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-muted">Type</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-muted">Via</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-muted">Location</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-muted">Stage</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((app: Application) => {
                const activeStage = app.stages.find((s) => s.status === "UPCOMING");
                return (
                  <tr
                    key={app.id}
                    onClick={() => setSelectedId(app.id)}
                    className="border-b border-border hover:bg-surface-hover cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium text-text-primary">{app.companyName}</span>
                        {app.companyUrl && (
                          <a
                            href={app.companyUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-text-muted hover:text-text-secondary"
                          >
                            <HugeiconsIcon icon={Share01Icon} size={11} strokeWidth={1.5} />
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-text-secondary">{app.position}</td>
                    <td className="px-4 py-3"><StatusBadge status={app.status} /></td>
                    <td className="px-4 py-3 text-text-muted">{formatDate(app.appliedDate)}</td>
                    <td className="px-4 py-3"><WorkModeBadge mode={app.workMode as import("@/types").WorkMode} /></td>
                    <td className="px-4 py-3 text-text-muted">{app.jobType}</td>
                    <td className="px-4 py-3 text-text-muted">{app.appliedVia}</td>
                    <td className="px-4 py-3 text-text-muted">{app.location || "—"}</td>
                    <td className="px-4 py-3 text-text-muted">{activeStage?.name ?? "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-6 py-3 border-t border-border">
          <p className="text-xs text-text-muted">{total} applications</p>
          <div className="flex items-center gap-2">
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => setPage(i + 1)}
                className={`w-7 h-7 text-xs rounded-btn transition-colors ${page === i + 1 ? "bg-accent text-white" : "text-text-muted hover:text-text-primary hover:bg-surface-hover"}`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </div>
      )}

      <AddApplicationModal open={addOpen} onClose={() => setAddOpen(false)} />
      <ApplicationDetail applicationId={selectedId} onClose={() => setSelectedId(null)} />
    </div>
  );
}

"use client";

import useSWR from "swr";
import {
  Add01Icon,
  ArrowDataTransferHorizontalIcon,
  GitCommitHorizontalIcon,
  UserGroupIcon,
  Note01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Header } from "@/components/layout/header";
import { formatRelativeDate } from "@/lib/utils";
import type { IconSvgElement } from "@hugeicons/react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const TYPE_ICONS: Record<string, IconSvgElement> = {
  created:        Add01Icon,
  status_change:  ArrowDataTransferHorizontalIcon,
  stage_added:    GitCommitHorizontalIcon,
  stage_updated:  GitCommitHorizontalIcon,
  contact_added:  UserGroupIcon,
  document_added: Note01Icon,
};

const TYPE_COLORS: Record<string, string> = {
  created:        "text-success",
  status_change:  "text-info",
  stage_added:    "text-accent",
  stage_updated:  "text-warning",
  contact_added:  "text-text-secondary",
  document_added: "text-text-secondary",
};

interface ActivityItem {
  id: string;
  type: string;
  description: string;
  createdAt: string;
  applicationId: string;
  application: { companyName: string; position: string };
}

export default function TimelinePage() {
  const { data, isLoading } = useSWR<{ data: ActivityItem[]; total: number }>(
    "/api/timeline?limit=100",
    fetcher
  );

  const items = data?.data ?? [];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header title="Timeline" />
      <div className="flex-1 overflow-y-auto p-6">
        {isLoading && (
          <div className="text-center text-text-muted text-sm py-8">Loading...</div>
        )}
        {!isLoading && items.length === 0 && (
          <div className="text-center text-text-muted text-sm py-8">
            No activity yet. Add your first application to get started.
          </div>
        )}

        <div className="flex flex-col relative">
          {items.length > 0 && (
            <div className="absolute left-4.5 top-2 bottom-2 w-px bg-border" />
          )}
          {items.map((item) => {
            const icon = TYPE_ICONS[item.type] ?? GitCommitHorizontalIcon;
            const color = TYPE_COLORS[item.type] ?? "text-text-muted";
            return (
              <div key={item.id} className="flex items-start gap-4 py-3 relative">
                <div className="w-9 h-9 rounded-full bg-surface border border-border flex items-center justify-center shrink-0 z-10">
                  <HugeiconsIcon icon={icon} size={15} strokeWidth={1.5} className={color} />
                </div>
                <div className="flex-1 min-w-0 pt-1.5">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="text-xs font-medium text-accent">{item.application.companyName}</span>
                    <span className="text-xs text-text-muted">{item.application.position}</span>
                  </div>
                  <p className="text-sm text-text-secondary mt-0.5">{item.description}</p>
                  <p className="text-xs text-text-muted mt-0.5">{formatRelativeDate(item.createdAt)}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

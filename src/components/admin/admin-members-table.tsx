"use client";

import { useState } from "react";
import type { AdminMemberRow } from "@/lib/admin-overview";

type SortKey = "registeredAt" | "lastSignInAt";

const fmtDate = (s: string | null) =>
  s ? new Date(s).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "-";

const fmtDateTime = (s: string | null) =>
  s
    ? new Date(s).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "-";

const PLAN_STYLES: Record<string, string> = {
  FREE: "bg-surface-hover text-text-secondary",
  PRO: "bg-accent-soft text-accent-soft-fg",
  MAX: "bg-accent text-accent-foreground",
};

const providerLabel = (p: string | null) =>
  p === "github" ? "GitHub" : p === "email" ? "Magic link" : p ?? "-";

/**
 * Expanded, sortable members table. Sorting is client-side (the base is small)
 * and limited to the two time columns the founder reads most: when someone
 * registered and when they last signed in. All values arrive pre-merged from
 * the server; this component renders only, it never fetches.
 */
export function AdminMembersTable({ members }: { members: AdminMemberRow[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("lastSignInAt");
  const [dir, setDir] = useState<"asc" | "desc">("desc");

  const sorted = [...members].sort((a, b) => {
    const av = a[sortKey] ? new Date(a[sortKey] as string).getTime() : 0;
    const bv = b[sortKey] ? new Date(b[sortKey] as string).getTime() : 0;
    return dir === "desc" ? bv - av : av - bv;
  });

  const toggle = (key: SortKey) => {
    if (key === sortKey) {
      setDir(dir === "desc" ? "asc" : "desc");
    } else {
      setSortKey(key);
      setDir("desc");
    }
  };

  const arrow = (key: SortKey) => (sortKey === key ? (dir === "desc" ? " ↓" : " ↑") : "");

  return (
    <div className="overflow-x-auto rounded-card border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs text-text-muted">
            <th className="px-3 py-2 font-medium">Member</th>
            <th className="px-3 py-2 font-medium">Plan</th>
            <th className="px-3 py-2 font-medium">Provider</th>
            <th
              className="px-3 py-2 font-medium cursor-pointer select-none hover:text-text-secondary transition-colors"
              onClick={() => toggle("registeredAt")}
            >
              Registered{arrow("registeredAt")}
            </th>
            <th
              className="px-3 py-2 font-medium cursor-pointer select-none hover:text-text-secondary transition-colors"
              onClick={() => toggle("lastSignInAt")}
            >
              Last sign in{arrow("lastSignInAt")}
            </th>
            <th className="px-3 py-2 font-medium">Returned</th>
            <th className="px-3 py-2 font-medium">Apps</th>
            <th className="px-3 py-2 font-medium">Onboarded</th>
            <th className="px-3 py-2 font-medium">Last activity</th>
          </tr>
        </thead>
        <tbody>
          {members.length === 0 ? (
            <tr>
              <td colSpan={9} className="px-3 py-8 text-center text-text-muted">
                No members yet.
              </td>
            </tr>
          ) : (
            sorted.map((m) => (
              <tr
                key={m.id}
                className="border-b border-border last:border-0 hover:bg-surface-hover/50 transition-colors"
              >
                <td className="px-3 py-2">
                  <div className="font-medium text-text-primary">{m.name}</div>
                  <div className="text-xs text-text-muted">{m.email}</div>
                </td>
                <td className="px-3 py-2">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      PLAN_STYLES[m.plan] ?? PLAN_STYLES.FREE
                    }`}
                  >
                    {m.plan}
                  </span>
                </td>
                <td className="px-3 py-2 text-text-secondary">{providerLabel(m.provider)}</td>
                <td className="px-3 py-2 text-text-secondary">{fmtDate(m.registeredAt)}</td>
                <td className="px-3 py-2 text-text-secondary">{fmtDateTime(m.lastSignInAt)}</td>
                <td className="px-3 py-2">
                  {m.returned ? (
                    <span className="text-status-offer-fg">Yes</span>
                  ) : (
                    <span className="text-text-muted">No</span>
                  )}
                </td>
                <td className="px-3 py-2 text-text-secondary">
                  {m.activeApps}
                  {m.trashedApps > 0 && (
                    <span className="text-text-muted"> ({m.trashedApps} trashed)</span>
                  )}
                </td>
                <td className="px-3 py-2">
                  {m.onboarded ? (
                    <span className="text-status-offer-fg">Yes</span>
                  ) : (
                    <span className="text-text-muted">No</span>
                  )}
                </td>
                <td className="px-3 py-2 text-text-secondary">{fmtDate(m.lastActivityAt)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

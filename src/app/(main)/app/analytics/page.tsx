"use client";

import dynamic from "next/dynamic";
import { Header } from "@/components/layout/header";
import { useAnalytics } from "@/hooks/use-analytics";

// Recharts is a heavy bundle — only load it once the user opens Analytics.
const AnalyticsCharts = dynamic(() => import("@/components/analytics/analytics-charts"), {
  ssr: false,
  loading: () => (
    <div className="h-[200px] flex items-center justify-center text-text-muted text-sm">Loading charts…</div>
  ),
});

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-surface border border-border rounded-card p-4">
      <p className="text-xs text-text-muted mb-1">{label}</p>
      <p className="text-2xl font-semibold text-text-primary">{value}</p>
      {sub && <p className="text-xs text-text-muted mt-0.5">{sub}</p>}
    </div>
  );
}

export default function AnalyticsPage() {
  const { analytics, isLoading } = useAnalytics();

  if (isLoading || !analytics) {
    return (
      <div className="flex flex-col h-full">
        <Header title="Analytics" />
        <div className="flex-1 flex items-center justify-center text-text-muted text-sm">Loading...</div>
      </div>
    );
  }

  const pct = (n: number) => `${Math.round(n * 100)}%`;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header title="Analytics" />
      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <StatCard label="Total applications" value={analytics.totalApplications} />
          <StatCard label="Response rate" value={pct(analytics.responseRate)} sub="of applied" />
          <StatCard label="Interview rate" value={pct(analytics.interviewRate)} sub="of applied" />
          <StatCard label="Offer rate" value={pct(analytics.offerRate)} sub="of applied" />
          <StatCard
            label="Avg days to response"
            value={analytics.avgDaysToFirstResponse !== null ? `${Math.round(analytics.avgDaysToFirstResponse)}d` : "—"}
          />
        </div>

        <AnalyticsCharts analytics={analytics} />
      </div>
    </div>
  );
}

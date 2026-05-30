"use client";

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { Header } from "@/components/layout/header";
import { useAnalytics } from "@/hooks/use-analytics";

const COLORS = ["#6C5CE7", "#3B82F6", "#22C55E", "#EAB308", "#EF4444", "#A1A1A1", "#6B6B6B", "#9C9C9C"];

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

  const statusData = Object.entries(analytics.statusBreakdown)
    .filter(([, v]) => v > 0)
    .map(([k, v]) => ({ name: k, value: v }));

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

        <div className="grid grid-cols-2 gap-6">
          {/* Funnel */}
          <div className="bg-surface border border-border rounded-card p-4">
            <h3 className="text-sm font-medium text-text-primary mb-4">Funnel</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={analytics.funnelData} layout="vertical">
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="stage" width={100} tick={{ fill: "#A1A1A1", fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ background: "#1C1C1C", border: "1px solid #2A2A2A", borderRadius: 8 }}
                  labelStyle={{ color: "#fff" }}
                  itemStyle={{ color: "#A1A1A1" }}
                />
                <Bar dataKey="count" fill="#6C5CE7" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Status distribution */}
          <div className="bg-surface border border-border rounded-card p-4">
            <h3 className="text-sm font-medium text-text-primary mb-4">Status distribution</h3>
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }: { name?: string; percent?: number }) => `${name ?? ""} ${Math.round((percent ?? 0) * 100)}%`} labelLine={false}>
                    {statusData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "#1C1C1C", border: "1px solid #2A2A2A", borderRadius: 8 }}
                    itemStyle={{ color: "#A1A1A1" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-text-muted text-sm">No data yet</div>
            )}
          </div>

          {/* Applications over time */}
          <div className="bg-surface border border-border rounded-card p-4 col-span-2">
            <h3 className="text-sm font-medium text-text-primary mb-4">Applications over time</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={analytics.applicationsOverTime}>
                <XAxis dataKey="date" tick={{ fill: "#6B6B6B", fontSize: 11 }} />
                <YAxis tick={{ fill: "#6B6B6B", fontSize: 11 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: "#1C1C1C", border: "1px solid #2A2A2A", borderRadius: 8 }}
                  itemStyle={{ color: "#A1A1A1" }}
                />
                <Line type="monotone" dataKey="count" stroke="#6C5CE7" strokeWidth={2} dot={false} name="Applied" />
                <Line type="monotone" dataKey="responses" stroke="#22C55E" strokeWidth={2} dot={false} name="Responses" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Source effectiveness */}
          {analytics.sourceEffectiveness.length > 0 && (
            <div className="bg-surface border border-border rounded-card p-4 col-span-2">
              <h3 className="text-sm font-medium text-text-primary mb-4">Source effectiveness</h3>
              <ResponsiveContainer width="100%" height={Math.max(120, analytics.sourceEffectiveness.length * 36)}>
                <BarChart data={analytics.sourceEffectiveness} layout="vertical">
                  <XAxis type="number" domain={[0, 1]} tickFormatter={(v) => `${Math.round(v * 100)}%`} tick={{ fill: "#6B6B6B", fontSize: 11 }} />
                  <YAxis type="category" dataKey="source" width={100} tick={{ fill: "#A1A1A1", fontSize: 12 }} />
                  <Tooltip
                    formatter={(v: unknown) => `${Math.round(Number(v) * 100)}%`}
                    contentStyle={{ background: "#1C1C1C", border: "1px solid #2A2A2A", borderRadius: 8 }}
                    itemStyle={{ color: "#A1A1A1" }}
                  />
                  <Bar dataKey="responseRate" fill="#3B82F6" radius={[0, 4, 4, 0]} name="Response rate" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

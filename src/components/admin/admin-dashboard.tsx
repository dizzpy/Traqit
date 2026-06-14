import { Header } from "@/components/layout/header";
import type { AdminOverview } from "@/lib/admin-overview";
import { AdminMembersTable } from "./admin-members-table";

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

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-surface border border-border rounded-card p-4">
      <p className="text-xs text-text-muted mb-1">{label}</p>
      <p className="text-2xl font-semibold text-text-primary">{value}</p>
      {sub && <p className="text-xs text-text-muted mt-0.5">{sub}</p>}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-sm font-semibold text-text-primary">{children}</h2>;
}

function FunnelBar({
  applied,
  interview,
  offer,
}: {
  applied: number;
  interview: number;
  offer: number;
}) {
  const max = Math.max(applied, 1);
  const stages = [
    { label: "Applied", n: applied },
    { label: "Interview", n: interview },
    { label: "Offer", n: offer },
  ];
  return (
    <div className="flex flex-col gap-2">
      {stages.map((s) => (
        <div key={s.label} className="flex items-center gap-3">
          <span className="w-20 text-xs text-text-secondary">{s.label}</span>
          <div className="flex-1 h-6 rounded-md bg-surface-hover overflow-hidden">
            <div
              className="h-full bg-accent/70"
              style={{ width: `${Math.round((s.n / max) * 100)}%` }}
            />
          </div>
          <span className="w-10 text-right text-xs text-text-primary font-medium">{s.n}</span>
        </div>
      ))}
    </div>
  );
}

/**
 * Founder dashboard. Pure presentation: every value is computed server-side in
 * getAdminOverview() and passed in. The only interactive island is the sortable
 * members table. Styled with the shared design tokens (no raw hex).
 */
export function AdminDashboard({ overview }: { overview: AdminOverview }) {
  const { growth, plans, activation, health, companies, operational, members } = overview;
  const planPct = (n: number) => (plans.total ? Math.round((n / plans.total) * 100) : 0);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header title="Admin" />
      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-8">
        {/* Growth */}
        <section className="flex flex-col gap-3">
          <SectionTitle>Growth</SectionTitle>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <StatCard label="Total users" value={growth.totalUsers} />
            <StatCard label="New today" value={growth.newToday} />
            <StatCard label="New, 7d" value={growth.new7d} />
            <StatCard label="New, 30d" value={growth.new30d} />
            <StatCard label="Active, 7d" value={growth.recentlyActive7d} sub="signed in" />
            <StatCard label="Never returned" value={growth.neverReturned} sub="signed up once" />
          </div>
        </section>

        {/* Plans and activation */}
        <section className="flex flex-col gap-3">
          <SectionTitle>Plans and activation</SectionTitle>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-surface border border-border rounded-card p-4">
              <p className="text-xs text-text-muted mb-2">Plan mix</p>
              <div className="flex flex-col gap-1.5">
                {(["FREE", "PRO", "MAX"] as const).map((k) => (
                  <div key={k} className="flex items-center justify-between text-sm">
                    <span className="text-text-secondary">{k}</span>
                    <span className="text-text-primary font-medium">
                      {plans[k]} <span className="text-text-muted">({planPct(plans[k])}%)</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <StatCard
              label="Onboarded"
              value={`${activation.onboardedPct}%`}
              sub={`${activation.onboardedCount} of ${plans.total}`}
            />
            <StatCard
              label="Has 1+ application"
              value={`${activation.withAppPct}%`}
              sub={`${activation.withAppCount} of ${plans.total}`}
            />
            <StatCard label="Recently active" value={growth.recentlyActive7d} sub="last 7 days" />
          </div>
        </section>

        {/* Members */}
        <section className="flex flex-col gap-3">
          <SectionTitle>Members ({members.length})</SectionTitle>
          <AdminMembersTable members={members} />
        </section>

        {/* Product health */}
        <section className="flex flex-col gap-3">
          <SectionTitle>Product health</SectionTitle>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard label="Total applications" value={health.totalApplications} />
            <StatCard label="Avg per active user" value={health.avgPerActiveUser} />
            <StatCard label="Email templates" value={health.adoption.emailTemplates} />
            <StatCard label="Saved jobs" value={health.adoption.savedJobs} />
          </div>
          <div className="bg-surface border border-border rounded-card p-4">
            <p className="text-xs text-text-muted mb-3">Funnel (across all members)</p>
            <FunnelBar
              applied={health.funnel.applied}
              interview={health.funnel.interview}
              offer={health.funnel.offer}
            />
          </div>
        </section>

        {/* Company insights */}
        <section className="flex flex-col gap-3">
          <SectionTitle>Company insights</SectionTitle>
          <div className="overflow-x-auto rounded-card border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-text-muted">
                  <th className="px-3 py-2 font-medium">Company</th>
                  <th className="px-3 py-2 font-medium">Applications</th>
                  <th className="px-3 py-2 font-medium">Responded</th>
                  <th className="px-3 py-2 font-medium">Ghosted</th>
                  <th className="px-3 py-2 font-medium">Response rate</th>
                </tr>
              </thead>
              <tbody>
                {companies.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-3 py-6 text-center text-text-muted">
                      No application data yet.
                    </td>
                  </tr>
                ) : (
                  companies.map((c) => (
                    <tr key={c.company} className="border-b border-border last:border-0">
                      <td className="px-3 py-2 text-text-primary">{c.company}</td>
                      <td className="px-3 py-2 text-text-secondary">{c.total}</td>
                      <td className="px-3 py-2 text-text-secondary">{c.responded}</td>
                      <td className="px-3 py-2 text-text-secondary">{c.ghosted}</td>
                      <td className="px-3 py-2 text-text-primary font-medium">
                        {Math.round(c.responseRate * 100)}%
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Operational */}
        <section className="flex flex-col gap-3">
          <SectionTitle>Operational</SectionTitle>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            <div className="bg-surface border border-border rounded-card p-4 lg:col-span-2">
              <p className="text-xs text-text-muted mb-3">Recent signups</p>
              <div className="flex flex-col gap-2">
                {operational.recentSignups.length === 0 ? (
                  <p className="text-sm text-text-muted">No signups yet.</p>
                ) : (
                  operational.recentSignups.map((s) => (
                    <div key={s.email} className="flex items-center justify-between text-sm">
                      <div className="min-w-0 truncate">
                        <span className="text-text-primary">{s.name}</span>
                        <span className="text-text-muted ml-2">{s.email}</span>
                      </div>
                      <span className="text-xs text-text-muted shrink-0 ml-3">{fmtDate(s.at)}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <StatCard label="Trash queue" value={operational.trashQueue} sub="awaiting purge" />
              <div className="bg-surface border border-border rounded-card p-4">
                <p className="text-xs text-text-muted mb-1">Trash purge</p>
                <p className="text-sm text-text-primary">{operational.purgeSchedule}</p>
                <p className="text-xs text-text-muted mt-1">
                  Last run: {fmtDateTime(operational.lastPurgeRun)}
                </p>
              </div>
            </div>
          </div>
        </section>

        <p className="text-xs text-text-muted">Data as of {fmtDateTime(overview.generatedAt)}</p>
      </div>
    </div>
  );
}

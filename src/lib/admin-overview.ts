import type { Plan } from "@prisma/client";
import { prisma } from "./prisma";
import { createAdminClient } from "./supabase/admin";

/**
 * Founder dashboard data layer. SERVER ONLY: pulls Supabase auth metadata via
 * the service-role client (which is null on the client) and merges it with
 * Prisma aggregates. Only ever called from the admin-gated page, never exposed
 * to a non-admin and never shipped to the browser.
 */

const DAY_MS = 24 * 60 * 60 * 1000;
// A magic-link signup logs in once at registration, so the first session equals
// created_at. A sign-in more than this far past registration means they came
// back at least once.
const RETURN_THRESHOLD_MS = 10 * 60 * 1000;

export type AdminMemberRow = {
  id: string;
  userId: string;
  name: string;
  email: string;
  plan: Plan;
  provider: string | null;
  registeredAt: string | null;
  lastSignInAt: string | null;
  returned: boolean;
  activeApps: number;
  trashedApps: number;
  onboarded: boolean;
  lastActivityAt: string | null;
  avatar: string | null;
};

export type CompanyStat = {
  company: string;
  total: number;
  responded: number;
  ghosted: number;
  responseRate: number;
};

export type AdminOverview = {
  generatedAt: string;
  growth: {
    totalUsers: number;
    newToday: number;
    new7d: number;
    new30d: number;
    recentlyActive7d: number;
    neverReturned: number;
  };
  plans: { FREE: number; PRO: number; MAX: number; total: number };
  activation: {
    onboardedCount: number;
    onboardedPct: number;
    withAppCount: number;
    withAppPct: number;
  };
  health: {
    totalApplications: number;
    avgPerActiveUser: number;
    funnel: { applied: number; interview: number; offer: number };
    statusCounts: Record<string, number>;
    adoption: { emailTemplates: number; pipelineTemplates: number; savedJobs: number };
  };
  companies: CompanyStat[];
  operational: {
    recentSignups: { name: string; email: string; at: string | null }[];
    trashQueue: number;
    purgeSchedule: string;
    lastPurgeRun: string | null;
  };
  members: AdminMemberRow[];
};

type AuthInfo = {
  createdAt: string | null;
  lastSignInAt: string | null;
  provider: string | null;
  emailConfirmedAt: string | null;
  avatar: string | null;
};

/**
 * Every auth user, keyed by id. Paginated (the API caps at 1000/page) so this
 * keeps working as the base grows. Degrades to an empty map when the
 * service-role key is missing (dashboard then falls back to Profile data).
 */
async function fetchAuthUsers(): Promise<Map<string, AuthInfo>> {
  const admin = createAdminClient();
  const map = new Map<string, AuthInfo>();
  if (!admin) return map;

  const perPage = 1000;
  for (let page = 1; ; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error || !data) break;
    for (const u of data.users) {
      const meta = u.user_metadata ?? {};
      map.set(u.id, {
        createdAt: u.created_at ?? null,
        lastSignInAt: u.last_sign_in_at ?? null,
        provider: (u.app_metadata?.provider as string | undefined) ?? null,
        emailConfirmedAt: (u.email_confirmed_at as string | undefined) ?? null,
        avatar: (meta.avatar_url as string | undefined) ?? (meta.picture as string | undefined) ?? null,
      });
    }
    if (data.users.length < perPage) break;
  }
  return map;
}

const RESPONDED_STATUSES = new Set(["IN_PROGRESS", "OFFER", "ACCEPTED", "REJECTED"]);

export async function getAdminOverview(): Promise<AdminOverview> {
  const [
    profiles,
    activeByProfile,
    trashedByProfile,
    statusGroups,
    companyStatusGroups,
    appUpdateByProfile,
    activityByProfile,
    emailTemplateCount,
    pipelineTemplateCount,
    trashedAppCount,
    trashedTemplateCount,
    authUsers,
  ] = await Promise.all([
    prisma.profile.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        userId: true,
        name: true,
        email: true,
        createdAt: true,
        onboardedAt: true,
        subscription: { select: { plan: true } },
      },
    }),
    prisma.application.groupBy({ by: ["profileId"], where: { deletedAt: null }, _count: { _all: true } }),
    prisma.application.groupBy({ by: ["profileId"], where: { deletedAt: { not: null } }, _count: { _all: true } }),
    prisma.application.groupBy({ by: ["status"], where: { deletedAt: null }, _count: { _all: true } }),
    prisma.application.groupBy({ by: ["companyName", "status"], where: { deletedAt: null }, _count: { _all: true } }),
    prisma.application.groupBy({ by: ["profileId"], _max: { updatedAt: true } }),
    prisma.$queryRaw<{ profileId: string; last: Date | null }[]>`
      SELECT app."profileId" AS "profileId", MAX(act."createdAt") AS last
      FROM "Activity" act JOIN "Application" app ON app.id = act."applicationId"
      GROUP BY app."profileId"`,
    prisma.emailTemplate.count({ where: { deletedAt: null } }),
    prisma.pipelineTemplate.count(),
    prisma.application.count({ where: { deletedAt: { not: null } } }),
    prisma.emailTemplate.count({ where: { deletedAt: { not: null } } }),
    fetchAuthUsers(),
  ]);

  const activeMap = new Map(activeByProfile.map((r) => [r.profileId, r._count._all]));
  const trashedMap = new Map(trashedByProfile.map((r) => [r.profileId, r._count._all]));
  const appUpdateMap = new Map(appUpdateByProfile.map((r) => [r.profileId, r._max.updatedAt]));
  const activityMap = new Map(activityByProfile.map((r) => [r.profileId, r.last]));

  const now = Date.now();
  const isWithin = (iso: string | null, ms: number) =>
    iso != null && now - new Date(iso).getTime() <= ms;

  // ---- per-member rows ----
  const members: AdminMemberRow[] = profiles.map((p) => {
    const auth = authUsers.get(p.userId);
    const registeredAt = auth?.createdAt ?? p.createdAt.toISOString();
    const lastSignInAt = auth?.lastSignInAt ?? null;
    const returned =
      lastSignInAt != null &&
      new Date(lastSignInAt).getTime() - new Date(registeredAt).getTime() > RETURN_THRESHOLD_MS;

    const appUpdate = appUpdateMap.get(p.id) ?? null;
    const activity = activityMap.get(p.id) ?? null;
    const lastActivityAt = [appUpdate, activity]
      .filter((d): d is Date => d != null)
      .sort((a, b) => b.getTime() - a.getTime())[0]
      ?.toISOString() ?? null;

    return {
      id: p.id,
      userId: p.userId,
      name: p.name,
      email: p.email,
      plan: p.subscription?.plan ?? "FREE",
      provider: auth?.provider ?? null,
      registeredAt,
      lastSignInAt,
      returned,
      activeApps: activeMap.get(p.id) ?? 0,
      trashedApps: trashedMap.get(p.id) ?? 0,
      onboarded: p.onboardedAt != null,
      lastActivityAt,
      avatar: auth?.avatar ?? null,
    };
  });

  // ---- growth ----
  const totalUsers = members.length;
  const newToday = members.filter((m) => isWithin(m.registeredAt, DAY_MS)).length;
  const new7d = members.filter((m) => isWithin(m.registeredAt, 7 * DAY_MS)).length;
  const new30d = members.filter((m) => isWithin(m.registeredAt, 30 * DAY_MS)).length;
  const recentlyActive7d = members.filter((m) => isWithin(m.lastSignInAt, 7 * DAY_MS)).length;
  const neverReturned = members.filter((m) => !m.returned).length;

  // ---- plans ----
  const plans = { FREE: 0, PRO: 0, MAX: 0, total: totalUsers };
  for (const m of members) plans[m.plan] += 1;

  // ---- activation ----
  const onboardedCount = members.filter((m) => m.onboarded).length;
  const withAppCount = members.filter((m) => m.activeApps > 0).length;
  const pct = (n: number) => (totalUsers ? Math.round((n / totalUsers) * 100) : 0);

  // ---- health ----
  const statusCounts: Record<string, number> = {};
  for (const g of statusGroups) statusCounts[g.status] = g._count._all;
  const totalApplications = Object.values(statusCounts).reduce((s, n) => s + n, 0);
  const applied = totalApplications - (statusCounts.SAVED ?? 0);
  const interview = (statusCounts.IN_PROGRESS ?? 0) + (statusCounts.OFFER ?? 0) + (statusCounts.ACCEPTED ?? 0);
  const offer = (statusCounts.OFFER ?? 0) + (statusCounts.ACCEPTED ?? 0);
  const avgPerActiveUser = withAppCount ? Math.round((totalApplications / withAppCount) * 10) / 10 : 0;

  // ---- companies (rough response/ghost rate) ----
  const companyMap = new Map<string, CompanyStat>();
  for (const g of companyStatusGroups) {
    const c = companyMap.get(g.companyName) ?? {
      company: g.companyName,
      total: 0,
      responded: 0,
      ghosted: 0,
      responseRate: 0,
    };
    c.total += g._count._all;
    if (RESPONDED_STATUSES.has(g.status)) c.responded += g._count._all;
    if (g.status === "GHOSTED") c.ghosted += g._count._all;
    companyMap.set(g.companyName, c);
  }
  const companies = [...companyMap.values()]
    .map((c) => ({ ...c, responseRate: c.total ? Math.round((c.responded / c.total) * 100) / 100 : 0 }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 12);

  // ---- operational ----
  const recentSignups = [...members]
    .sort((a, b) => new Date(b.registeredAt ?? 0).getTime() - new Date(a.registeredAt ?? 0).getTime())
    .slice(0, 8)
    .map((m) => ({ name: m.name, email: m.email, at: m.registeredAt }));

  let lastPurgeRun: string | null = null;
  try {
    const rows = await prisma.$queryRaw<{ end_time: Date | null }[]>`
      SELECT d.end_time FROM cron.job_run_details d
      JOIN cron.job j ON j.jobid = d.jobid
      WHERE j.jobname = 'purge-trash-daily' AND d.status = 'succeeded'
      ORDER BY d.end_time DESC LIMIT 1`;
    lastPurgeRun = rows[0]?.end_time?.toISOString() ?? null;
  } catch {
    // cron schema not readable from this role, so the schedule is shown instead.
    lastPurgeRun = null;
  }

  return {
    generatedAt: new Date(now).toISOString(),
    growth: { totalUsers, newToday, new7d, new30d, recentlyActive7d, neverReturned },
    plans,
    activation: {
      onboardedCount,
      onboardedPct: pct(onboardedCount),
      withAppCount,
      withAppPct: pct(withAppCount),
    },
    health: {
      totalApplications,
      avgPerActiveUser,
      funnel: { applied, interview, offer },
      statusCounts,
      adoption: {
        emailTemplates: emailTemplateCount,
        pipelineTemplates: pipelineTemplateCount,
        savedJobs: statusCounts.SAVED ?? 0,
      },
    },
    companies,
    operational: {
      recentSignups,
      trashQueue: trashedAppCount + trashedTemplateCount,
      purgeSchedule: "Daily at 03:00 UTC (purge-trash-daily)",
      lastPurgeRun,
    },
    members,
  };
}

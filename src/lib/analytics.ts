import type { Application, AnalyticsData, ApplicationStatus } from "@/types";
import { differenceInDays, format, subWeeks, startOfWeek } from "date-fns";

export function computeAnalytics(applications: Application[]): AnalyticsData {
  const total = applications.length;
  const nonSaved = applications.filter((a) => a.status !== "SAVED");
  const nonSavedCount = nonSaved.length;

  // Response rate: (total - APPLIED - SAVED - GHOSTED) / (total - SAVED)
  const responded = applications.filter(
    (a) => !["SAVED", "APPLIED", "GHOSTED"].includes(a.status)
  ).length;
  const responseRate = nonSavedCount > 0 ? responded / nonSavedCount : 0;

  // Interview rate: IN_PROGRESS + OFFER + ACCEPTED / nonSaved
  const interviewed = applications.filter((a) =>
    ["IN_PROGRESS", "OFFER", "ACCEPTED"].includes(a.status)
  ).length;
  const interviewRate = nonSavedCount > 0 ? interviewed / nonSavedCount : 0;

  // Offer rate: OFFER + ACCEPTED / nonSaved
  const offers = applications.filter((a) =>
    ["OFFER", "ACCEPTED"].includes(a.status)
  ).length;
  const offerRate = nonSavedCount > 0 ? offers / nonSavedCount : 0;

  // Avg days to first response
  const withResponse = applications.filter(
    (a) => a.appliedDate && a.firstResponseDate
  );
  const avgDaysToFirstResponse =
    withResponse.length > 0
      ? withResponse.reduce(
          (sum, a) =>
            sum +
            differenceInDays(
              new Date(a.firstResponseDate!),
              new Date(a.appliedDate!)
            ),
          0
        ) / withResponse.length
      : null;

  // Status breakdown
  const statusBreakdown = {} as Record<ApplicationStatus, number>;
  const statuses: ApplicationStatus[] = [
    "SAVED", "APPLIED", "IN_PROGRESS", "OFFER",
    "ACCEPTED", "REJECTED", "GHOSTED", "WITHDRAWN",
  ];
  for (const s of statuses) {
    statusBreakdown[s] = applications.filter((a) => a.status === s).length;
  }

  // Source effectiveness
  const sourceMap = new Map<string, { total: number; responded: number }>();
  for (const app of nonSaved) {
    const src = app.appliedVia;
    if (!sourceMap.has(src)) sourceMap.set(src, { total: 0, responded: 0 });
    const entry = sourceMap.get(src)!;
    entry.total++;
    if (!["APPLIED", "GHOSTED"].includes(app.status)) entry.responded++;
  }
  const sourceEffectiveness = Array.from(sourceMap.entries())
    .filter(([, v]) => v.total >= 2)
    .map(([source, v]) => ({
      source,
      total: v.total,
      responseRate: v.total > 0 ? v.responded / v.total : 0,
    }))
    .sort((a, b) => b.responseRate - a.responseRate);

  // Applications over time (last 12 weeks)
  const applicationsOverTime = [];
  for (let i = 11; i >= 0; i--) {
    const weekStart = startOfWeek(subWeeks(new Date(), i));
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const count = applications.filter((a) => {
      if (!a.appliedDate) return false;
      const d = new Date(a.appliedDate);
      return d >= weekStart && d < weekEnd;
    }).length;

    const responses = applications.filter((a) => {
      if (!a.firstResponseDate) return false;
      const d = new Date(a.firstResponseDate);
      return d >= weekStart && d < weekEnd;
    }).length;

    applicationsOverTime.push({
      date: format(weekStart, "MMM d"),
      count,
      responses,
    });
  }

  // Funnel
  const funnelData = [
    { stage: "Applied", count: nonSavedCount },
    { stage: "Got Response", count: responded },
    { stage: "Interviewed", count: interviewed },
    { stage: "Got Offer", count: offers },
  ].map((f) => ({
    ...f,
    pct: nonSavedCount > 0 ? Math.round((f.count / nonSavedCount) * 100) : 0,
  }));

  return {
    totalApplications: total,
    responseRate,
    interviewRate,
    offerRate,
    avgDaysToFirstResponse,
    statusBreakdown,
    sourceEffectiveness,
    applicationsOverTime,
    funnelData,
  };
}

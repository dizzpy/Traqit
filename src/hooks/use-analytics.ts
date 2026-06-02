import useSWR from "swr";
import type { AnalyticsData } from "@/types";

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error("Fetch error");
    return r.json();
  });

export function useAnalytics() {
  const { data, error, isLoading } = useSWR<{ data: AnalyticsData }>("/api/analytics", fetcher);
  return { analytics: data?.data ?? null, isLoading, error };
}

import useSWR from "swr";
import type { Profile } from "@/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type ProfilePrefs = Pick<
  Profile,
  "id" | "name" | "defaultCurrency" | "defaultPipelineTemplateId" | "ghostThresholdDays"
>;

export function useProfile() {
  const { data, error, isLoading, mutate } = useSWR<{ data: ProfilePrefs }>("/api/profile", fetcher);
  return { profile: data?.data ?? null, isLoading, error, mutate };
}

export async function updateProfile(patch: Partial<ProfilePrefs>) {
  const res = await fetch("/api/profile", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  if (!res.ok) {
    const json = await res.json().catch(() => null);
    throw new Error(json?.error?.message ?? "Failed to update profile");
  }
  return res.json();
}

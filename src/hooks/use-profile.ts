import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

/** Full profile + linked auth account info returned by GET /api/profile. */
export interface ProfileAccount {
  id: string;
  name: string;
  email: string;
  defaultCurrency: string;
  defaultPipelineTemplateId: string | null;
  ghostThresholdDays: number;
  emailName: string | null;
  remindersEnabled: boolean;
  reminderLeadTime: number;
  createdAt: string;
  avatarUrl: string | null;
  provider: string | null;
}

/** Fields a user can actually edit (everything else is auth-derived/read-only). */
export type ProfileUpdate = Partial<
  Pick<
    ProfileAccount,
    | "name"
    | "defaultCurrency"
    | "defaultPipelineTemplateId"
    | "ghostThresholdDays"
    | "emailName"
    | "remindersEnabled"
    | "reminderLeadTime"
  >
>;

/** Profile rarely changes — dedupe aggressively and don't refetch on focus/reconnect. */
const PROFILE_SWR_CONFIG = {
  dedupingInterval: 60_000,
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
} as const;

export function useProfile() {
  const { data, error, isLoading, mutate } = useSWR<{ data: ProfileAccount }>(
    "/api/profile",
    fetcher,
    PROFILE_SWR_CONFIG
  );
  return { profile: data?.data ?? null, isLoading, error, mutate };
}

export async function updateProfile(patch: ProfileUpdate) {
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

import useSWR from "swr";

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error("Fetch error");
    return r.json();
  });

export interface TrashedApplication {
  id: string;
  companyName: string;
  position: string;
  status: string;
  deletedAt: string;
}

export interface TrashedEmailTemplate {
  id: string;
  name: string;
  subject: string;
  category: string;
  deletedAt: string;
}

interface TrashData {
  applications: TrashedApplication[];
  emailTemplates: TrashedEmailTemplate[];
  counts: { applications: number; emailTemplates: number };
}

export function useTrash() {
  const { data, error, isLoading, mutate } = useSWR<{ data: TrashData }>("/api/trash", fetcher, {
    revalidateOnFocus: false,
  });
  return {
    applications: data?.data.applications ?? [],
    emailTemplates: data?.data.emailTemplates ?? [],
    counts: data?.data.counts ?? { applications: 0, emailTemplates: 0 },
    isLoading,
    error,
    mutate,
  };
}

/** Permanently delete items from Trash. Pass no ids to empty that whole type. */
export async function purgeTrash(type: "application" | "emailTemplate", ids?: string[]) {
  const res = await fetch("/api/trash/purge", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type, ...(ids ? { ids } : {}) }),
  });
  if (!res.ok) throw new Error("Failed to purge");
  return res.json();
}

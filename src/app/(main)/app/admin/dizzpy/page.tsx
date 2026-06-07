import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminEmail } from "@/lib/admin";
import { AdminMembers, type AdminMember } from "@/components/admin/admin-members";

/**
 * Avatars live in Supabase auth (user_metadata.avatar_url from GitHub, or
 * `picture` from Google) — not in our Profile table. Pull them in one
 * service-role call and map by auth user id. Degrades to no avatars (initials)
 * when the service-role key is missing.
 */
async function fetchAvatarsByUserId(): Promise<Map<string, string>> {
  const admin = createAdminClient();
  const map = new Map<string, string>();
  if (!admin) return map;

  const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (error || !data) return map;

  for (const u of data.users) {
    const meta = u.user_metadata ?? {};
    const url = (meta.avatar_url as string | undefined) || (meta.picture as string | undefined);
    if (url) map.set(u.id, url);
  }
  return map;
}

// Admin surfaces are never cached and never statically rendered — the gate must
// run against the live session on every request.
export const dynamic = "force-dynamic";

export default async function AdminMembersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Anyone who isn't a signed-in admin gets a plain 404 — we don't reveal that
  // this route exists.
  if (!isAdminEmail(user?.email)) notFound();

  const [profiles, avatars] = await Promise.all([
    prisma.profile.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        userId: true,
        name: true,
        email: true,
        createdAt: true,
        _count: { select: { applications: true, emailTemplates: true } },
      },
    }),
    fetchAvatarsByUserId(),
  ]);

  const members: AdminMember[] = profiles.map((p) => ({
    id: p.id,
    name: p.name,
    email: p.email,
    joined: p.createdAt.toISOString(),
    apps: p._count.applications,
    templates: p._count.emailTemplates,
    avatar: avatars.get(p.userId),
  }));

  return <AdminMembers members={members} />;
}

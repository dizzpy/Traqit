import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/admin";
import { getAdminOverview } from "@/lib/admin-overview";
import { AdminDashboard } from "@/components/admin/admin-dashboard";

// Admin surfaces are never cached and never statically rendered: the gate must
// run against the live session on every request.
export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Anyone who isn't a signed-in admin gets a plain 404, so we never reveal that
  // this route exists. All admin data fetching happens after this gate.
  if (!isAdminEmail(user?.email)) notFound();

  const overview = await getAdminOverview();
  return <AdminDashboard overview={overview} />;
}

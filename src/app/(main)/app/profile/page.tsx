import { redirect } from "next/navigation";

/**
 * Profile and Settings were merged into one page (story 12.1) — this route
 * only exists so old links/bookmarks to /app/profile keep working.
 */
export default function ProfilePage() {
  redirect("/app/settings");
}

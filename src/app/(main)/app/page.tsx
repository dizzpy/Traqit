import { redirect } from "next/navigation";

// /app has no view of its own — send it to the default landing surface, the
// same one the auth callback uses after login.
export default function AppIndexPage() {
  redirect("/app/applications");
}

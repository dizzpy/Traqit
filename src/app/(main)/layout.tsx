import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { KeyboardShortcuts } from "@/components/layout/keyboard-shortcuts";
import { Toaster } from "sonner";
import { getProfile } from "@/lib/auth";

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  // Anyone who hasn't finished the guided setup is sent there first, so the
  // dashboard is never reached "cold". (Auth itself is enforced in middleware.)
  const profile = await getProfile();
  if (profile && !profile.onboardedAt) redirect("/onboarding");

  return (
    <div className="flex h-screen overflow-hidden bg-bg">
      <KeyboardShortcuts />
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">{children}</main>
      <Toaster
        theme="dark"
        position="bottom-right"
        toastOptions={{
          style: {
            background: "var(--surface-elevated)",
            border: "1px solid var(--border)",
            color: "var(--text-primary)",
          },
        }}
      />
    </div>
  );
}

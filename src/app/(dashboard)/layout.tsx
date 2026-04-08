import { Sidebar } from "@/components/layout/sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-bg">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">{children}</main>
    </div>
  );
}

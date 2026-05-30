import { Header } from "@/components/layout/header";

export default function CalendarPage() {
  return (
    <div className="flex flex-col h-full">
      <Header title="Calendar" />
      <div className="flex-1 flex items-center justify-center text-text-muted text-sm">
        Coming in Sprint 2
      </div>
    </div>
  );
}

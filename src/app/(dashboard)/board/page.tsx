"use client";

import { useState } from "react";
import { Header } from "@/components/layout/header";
import { KanbanBoard } from "@/components/board/kanban-board";
import { AddApplicationModal } from "@/components/application/add-application-modal";
import { ApplicationDetail } from "@/components/application/application-detail";
import { useApplications } from "@/hooks/use-applications";
import type { Application } from "@/types";

export default function BoardPage() {
  const { applications, isLoading } = useApplications({ limit: 200 });
  const [addOpen, setAddOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header title="Board" onAdd={() => setAddOpen(true)} />

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center text-text-muted text-sm">
          Loading...
        </div>
      ) : (
        <div className="flex-1 overflow-hidden">
          <KanbanBoard
            applications={applications}
            onCardClick={(app: Application) => setSelectedId(app.id)}
          />
        </div>
      )}

      <AddApplicationModal open={addOpen} onClose={() => setAddOpen(false)} />
      <ApplicationDetail applicationId={selectedId} onClose={() => setSelectedId(null)} />
    </div>
  );
}

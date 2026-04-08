"use client";

import { Add01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  title: string;
  onAdd?: () => void;
  addLabel?: string;
  actions?: React.ReactNode;
}

export function Header({ title, onAdd, addLabel = "Add Application", actions }: HeaderProps) {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-bg shrink-0">
      <h1 className="text-xl font-semibold text-text-primary">{title}</h1>
      <div className="flex items-center gap-2">
        {actions}
        {onAdd && (
          <Button variant="cta" size="sm" onClick={onAdd}>
            <HugeiconsIcon icon={Add01Icon} size={14} strokeWidth={2} />
            {addLabel}
          </Button>
        )}
      </div>
    </div>
  );
}

"use client";

import { type IconSvgElement } from "@hugeicons/react";
import { HugeiconsIcon } from "@hugeicons/react";
import { HelpCircleIcon } from "@hugeicons/core-free-icons";
import { Modal } from "./modal";
import { Button } from "./button";
import { cn } from "@/lib/utils";

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "default" | "danger";
  icon?: IconSvgElement;
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "default",
  icon = HelpCircleIcon,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onClose} size="sm">
      <div className="p-6 flex flex-col items-center text-center gap-3">
        <div
          className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center mb-1",
            tone === "danger" ? "bg-[var(--status-rejected-bg)]" : "bg-accent-soft"
          )}
        >
          <HugeiconsIcon
            icon={icon}
            size={22}
            strokeWidth={1.5}
            className={tone === "danger" ? "text-[var(--status-rejected-fg)]" : "text-accent-soft-fg"}
          />
        </div>
        <h2 className="text-base font-semibold text-text-primary">{title}</h2>
        {message && <p className="text-sm text-text-secondary max-w-xs leading-relaxed">{message}</p>}
        <div className="flex gap-2 mt-2 w-full">
          <Button variant="outline" size="sm" className="flex-1" onClick={onClose}>
            {cancelLabel}
          </Button>
          <Button
            variant={tone === "danger" ? "danger" : "default"}
            size="sm"
            className="flex-1"
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

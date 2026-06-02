"use client";

import { useState } from "react";
import { Mail01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { EmailPreview } from "./email-preview";
import {
  useEmailTemplates,
  useProfileName,
} from "@/hooks/use-email-templates";
import {
  buildGmailDraftUrl,
  placeholderValuesFromApp,
  substitutePlaceholders,
} from "@/lib/email";
import { cn } from "@/lib/utils";
import type { Application, Contact } from "@/types";

interface DraftEmailModalProps {
  open: boolean;
  onClose: () => void;
  app: Application;
  contact: Contact;
}

export function DraftEmailModal({ open, onClose, app, contact }: DraftEmailModalProps) {
  const { templates } = useEmailTemplates();
  const myName = useProfileName();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = templates.find((t) => t.id === selectedId) ?? templates[0] ?? null;
  const values = placeholderValuesFromApp(app, contact.name, myName);

  function handleDraft() {
    if (!selected) return;
    const url = buildGmailDraftUrl({
      to: contact.email ?? undefined,
      subject: substitutePlaceholders(selected.subject, values),
      body: substitutePlaceholders(selected.body, values),
    });
    window.open(url, "_blank", "noopener,noreferrer");
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title={`Draft email to ${contact.name}`} size="lg">
      <div className="p-6 flex flex-col gap-4">
        {templates.length === 0 ? (
          <p className="text-sm text-text-muted">
            No email templates yet. Create one on the Email templates page first.
          </p>
        ) : (
          <>
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-text-secondary">Template</span>
              <div className="flex flex-wrap gap-2">
                {templates.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSelectedId(t.id)}
                    className={cn(
                      "px-3 py-1.5 rounded-input text-xs border transition-colors duration-150",
                      t.id === selected?.id
                        ? "bg-accent-soft text-accent-soft-fg border-transparent"
                        : "bg-surface-elevated text-text-secondary border-border hover:text-text-primary"
                    )}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            </div>

            {selected && (
              <EmailPreview
                subject={selected.subject}
                body={selected.body}
                values={values}
                to={contact.email ?? ""}
              />
            )}

            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" size="sm" onClick={onClose}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleDraft} disabled={!selected}>
                <HugeiconsIcon icon={Mail01Icon} size={13} strokeWidth={1.5} /> Draft in Gmail
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}

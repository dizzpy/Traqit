import { substitutePlaceholders, type PlaceholderValues } from "@/lib/email";

interface EmailPreviewProps {
  subject: string;
  body: string;
  values: PlaceholderValues;
  to?: string;
}

/**
 * Read-only render of a template's subject + body with placeholders substituted.
 * Shared by the templates-page editor preview and the contacts-tab draft modal so
 * both show the exact email that will open in Gmail.
 */
export function EmailPreview({ subject, body, values, to }: EmailPreviewProps) {
  const filledSubject = substitutePlaceholders(subject, values);
  const filledBody = substitutePlaceholders(body, values);

  return (
    <div className="rounded-card border border-border bg-surface-elevated overflow-hidden">
      {to !== undefined && (
        <div className="flex gap-2 px-4 py-2.5 border-b border-border">
          <span className="text-xs font-medium text-text-muted w-14 shrink-0">To</span>
          <span className="text-xs text-text-secondary truncate">{to || "—"}</span>
        </div>
      )}
      <div className="flex gap-2 px-4 py-2.5 border-b border-border">
        <span className="text-xs font-medium text-text-muted w-14 shrink-0">Subject</span>
        <span className="text-xs text-text-primary">{filledSubject || "—"}</span>
      </div>
      <div className="px-4 py-3">
        <p className="text-[13px] leading-[1.7] text-text-secondary whitespace-pre-wrap">
          {filledBody || "—"}
        </p>
      </div>
    </div>
  );
}

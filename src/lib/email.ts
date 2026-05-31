import type { Application } from "@/types";

/** Placeholder tokens supported in email templates. Drives the variable chips. */
export const EMAIL_PLACEHOLDERS = [
  "company",
  "position",
  "contact",
  "myName",
  "jobUrl",
] as const;

export type PlaceholderKey = (typeof EMAIL_PLACEHOLDERS)[number];

/** Categories a template can be filed under (used for the editor select + filter chips). */
export const EMAIL_TEMPLATE_CATEGORIES = [
  "Outreach",
  "Follow-up",
  "Cold",
  "Networking",
  "General",
] as const;

export type PlaceholderValues = Record<PlaceholderKey, string>;

/**
 * Replace every `{key}` in `text` with its value. Unknown placeholders are left
 * untouched; known placeholders with an empty value render as empty string.
 */
export function substitutePlaceholders(text: string, values: PlaceholderValues): string {
  return text.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? values[key as PlaceholderKey] : match
  );
}

/** Build placeholder values from an application, a chosen contact, and the user's name. */
export function placeholderValuesFromApp(
  app: Pick<Application, "companyName" | "position" | "jobPostUrl">,
  contactName: string,
  myName: string
): PlaceholderValues {
  return {
    company: app.companyName ?? "",
    position: app.position ?? "",
    contact: contactName,
    myName,
    jobUrl: app.jobPostUrl ?? "",
  };
}

interface GmailDraftParams {
  to?: string;
  subject: string;
  body: string;
}

/**
 * Build a Gmail compose URL with pre-filled recipient/subject/body. Opening it in
 * a new tab drops the user into a draft — nothing is sent automatically.
 */
export function buildGmailDraftUrl({ to, subject, body }: GmailDraftParams): string {
  const params = new URLSearchParams({ view: "cm", fs: "1", su: subject, body });
  if (to) params.set("to", to);
  return `https://mail.google.com/mail/?${params.toString()}`;
}

import nodemailer, { type Transporter } from "nodemailer";

/**
 * Server-only outbound email. Kept separate from `src/lib/email.ts`, which is
 * imported by client components and must never pull in nodemailer.
 *
 * Transport is plain SMTP read from env, so switching from Gmail (app
 * password) to another provider's SMTP is an env change, not a code change:
 *   SMTP_HOST, SMTP_PORT (465 = implicit TLS, else STARTTLS), SMTP_USER,
 *   SMTP_PASS, EMAIL_FROM (defaults to SMTP_USER).
 */
let transporter: Transporter | null = null;

export function isMailerConfigured(): boolean {
  return !!(
    process.env.SMTP_HOST &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS
  );
}

function getTransporter(): Transporter {
  if (!isMailerConfigured())
    throw new Error("Email is not configured (missing SMTP_* env vars)");
  if (!transporter) {
    const port = Number(process.env.SMTP_PORT ?? 465);
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
  return transporter;
}

export interface MailMessage {
  to: string;
  subject: string;
  text: string;
  html: string;
}

export async function sendMail(message: MailMessage): Promise<void> {
  const from = process.env.EMAIL_FROM ?? process.env.SMTP_USER;
  await getTransporter().sendMail({ from: `Traqit <${from}>`, ...message });
}

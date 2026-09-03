import { Resend } from "resend";

export const isResendConfigured = Boolean(process.env.RESEND_API_KEY);

let client: Resend | null = null;

/** Lazily constructed — the Resend constructor doesn't need a real key to build, but callers should check isResendConfigured first. */
export function getResendClient(): Resend {
  if (!client) client = new Resend(process.env.RESEND_API_KEY || "re_not_configured");
  return client;
}

export const ALERTS_FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "alerts@agentrankradar.com";

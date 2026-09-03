"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";
import { getCurrentContext } from "@/lib/auth-context";

const SLACK_WEBHOOK_PREFIX = "https://hooks.slack.com/services/";

/** Saves the org's Slack Incoming Webhook URL — Growth+ only. */
export async function saveSlackWebhook(formData: FormData): Promise<{ ok: true } | { ok: false; error: string }> {
  const context = await getCurrentContext();
  if (context.isDemo) return { ok: false, error: "Not available in demo mode." };

  const url = String(formData.get("webhookUrl") ?? "").trim();
  if (url && !url.startsWith(SLACK_WEBHOOK_PREFIX)) {
    return { ok: false, error: "That doesn't look like a Slack Incoming Webhook URL." };
  }

  const supabase = createServiceClient();
  const { error } = await supabase
    .from("organizations")
    .update({ slack_webhook_url: url || null })
    .eq("id", context.orgId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/dashboard/settings");
  return { ok: true };
}

/** Void-returning wrapper so this can be bound directly to a <form action>. */
export async function saveSlackWebhookForm(formData: FormData): Promise<void> {
  const result = await saveSlackWebhook(formData);
  if (!result.ok) console.error(`[integrations] saving Slack webhook failed: ${result.error}`);
}

/** Posts a test message to the org's configured Slack webhook, if any. */
export async function sendTestSlackMessage(): Promise<void> {
  const context = await getCurrentContext();
  if (context.isDemo) return;

  const supabase = createServiceClient();
  const { data: org } = await supabase.from("organizations").select("slack_webhook_url").eq("id", context.orgId).single();
  if (!org?.slack_webhook_url) return;

  try {
    await fetch(org.slack_webhook_url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text: "✅ Agent Rank Radar is connected — you'll get visibility and competitor alerts here." }),
    });
  } catch (error) {
    console.error("[integrations] Slack test message failed:", error);
  }
}

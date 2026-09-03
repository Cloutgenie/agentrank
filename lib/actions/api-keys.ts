"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";
import { getCurrentContext } from "@/lib/auth-context";
import { generateApiKey } from "@/lib/api-keys";
import { GROWTH_PLUS_TIERS } from "@/lib/plan-limits";

export interface CreateApiKeyState {
  rawKey: string | null;
  error: string | null;
}

/**
 * Creates a new API key for the signed-in user's org — the raw key is
 * returned exactly once (in this response) and never stored or shown
 * again; only its SHA-256 hash and a short display prefix are persisted.
 * Bound to a <form> via useFormState so the raw key can be shown inline
 * in the same render, unlike the void-returning action pattern used
 * elsewhere in this app.
 */
export async function createApiKey(_prevState: CreateApiKeyState, formData: FormData): Promise<CreateApiKeyState> {
  const context = await getCurrentContext();
  if (context.isDemo) return { rawKey: null, error: "Not available in demo mode." };

  const supabase = createServiceClient();
  const { data: org } = await supabase.from("organizations").select("plan_tier").eq("id", context.orgId).single();
  if (!org || !GROWTH_PLUS_TIERS.has(org.plan_tier)) {
    return { rawKey: null, error: "API access is a Growth-plan feature. Upgrade to create a key." };
  }

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { rawKey: null, error: "Give the key a name." };

  const { raw, hash, prefix } = generateApiKey();
  const { error } = await supabase.from("api_keys").insert({
    organization_id: context.orgId,
    name,
    key_hash: hash,
    key_prefix: prefix,
  });
  if (error) return { rawKey: null, error: error.message };

  revalidatePath("/dashboard/settings");
  return { rawKey: raw, error: null };
}

/** Revokes an API key — verifies ownership before touching it. */
export async function revokeApiKey(keyId: string): Promise<void> {
  const context = await getCurrentContext();
  if (context.isDemo) return;

  const supabase = createServiceClient();
  const { data: key } = await supabase.from("api_keys").select("organization_id").eq("id", keyId).single();
  if (key?.organization_id !== context.orgId) {
    console.error(`[api-keys] refused revoke: key ${keyId} not owned by org ${context.orgId}`);
    return;
  }

  await supabase.from("api_keys").update({ revoked_at: new Date().toISOString() }).eq("id", keyId);
  revalidatePath("/dashboard/settings");
}

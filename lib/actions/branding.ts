"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";
import { getCurrentContext } from "@/lib/auth-context";

const MAX_LOGO_BYTES = 2 * 1024 * 1024;

/** Uploads a white-label logo for the signed-in user's org (Agency tier only). */
export async function uploadOrgLogo(formData: FormData): Promise<{ ok: true } | { ok: false; error: string }> {
  const context = await getCurrentContext();
  if (context.isDemo) return { ok: false, error: "Not available in demo mode." };

  const file = formData.get("logo");
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: "Choose a logo file." };
  if (!file.type.startsWith("image/")) return { ok: false, error: "Logo must be an image." };
  if (file.size > MAX_LOGO_BYTES) return { ok: false, error: "Logo must be under 2MB." };

  const supabase = createServiceClient();
  const { data: org } = await supabase.from("organizations").select("white_label_enabled").eq("id", context.orgId).single();
  if (!org?.white_label_enabled) return { ok: false, error: "White-label branding is an Agency-plan feature." };

  const ext = file.name.split(".").pop() || "png";
  const path = `${context.orgId}/logo.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from("org-logos")
    .upload(path, buffer, { contentType: file.type, upsert: true });
  if (uploadError) return { ok: false, error: uploadError.message };

  const {
    data: { publicUrl },
  } = supabase.storage.from("org-logos").getPublicUrl(path);

  // Cache-bust: upsert reuses the same path, so without a changing query
  // string a browser/CDN could keep serving the previous logo indefinitely.
  await supabase.from("organizations").update({ logo_url: `${publicUrl}?v=${Date.now()}` }).eq("id", context.orgId);

  revalidatePath("/dashboard/settings");
  return { ok: true };
}

/** Void-returning wrapper so this can be bound directly to a <form action>. */
export async function uploadOrgLogoForm(formData: FormData): Promise<void> {
  const result = await uploadOrgLogo(formData);
  if (!result.ok) console.error(`[branding] logo upload failed: ${result.error}`);
}

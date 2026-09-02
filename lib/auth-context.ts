import { cache } from "react";
import { currentUser } from "@clerk/nextjs/server";
import { createServiceClient } from "@/lib/supabase/server";
import { isClerkConfigured } from "@/lib/clerk-configured";
import { slugify } from "@/lib/utils";
import { DEMO_ORG_ID, DEMO_PROJECT_ID } from "@/lib/queries";

export interface CurrentContext {
  userId: string | null;
  orgId: string;
  /** null means the org exists but hasn't onboarded a project yet. */
  projectId: string | null;
  isDemo: boolean;
}

/**
 * Resolves the signed-in Clerk user to their real organization/project,
 * creating both on first login. `cache()` memoizes this per request so
 * every page/action calling it doesn't re-run the provisioning queries.
 *
 * Falls back to the seeded demo org/project when Clerk isn't configured —
 * same graceful-degradation pattern used everywhere else in this app.
 */
export const getCurrentContext = cache(async (): Promise<CurrentContext> => {
  if (!isClerkConfigured) {
    return { userId: null, orgId: DEMO_ORG_ID, projectId: DEMO_PROJECT_ID, isDemo: true };
  }

  const user = await currentUser();
  if (!user) {
    // Shouldn't happen — middleware protects every /dashboard route once
    // Clerk is configured — but fall back rather than crash the page.
    return { userId: null, orgId: DEMO_ORG_ID, projectId: DEMO_PROJECT_ID, isDemo: true };
  }

  const supabase = createServiceClient();
  const email = user.primaryEmailAddress?.emailAddress ?? `${user.id}@unknown.local`;
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ") || null;

  await supabase.from("users").upsert(
    { id: user.id, email, full_name: fullName, avatar_url: user.imageUrl ?? null },
    { onConflict: "id" }
  );

  const { data: membership } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  let orgId: string;
  if (membership) {
    orgId = membership.organization_id;
  } else {
    orgId = await createOrgForUser(user.id, fullName ?? email);
  }

  // No project switcher yet (see docs/ROADMAP.md) — the org's first project
  // is "the" project. Agencies with multiple projects are a v2 concern.
  const { data: project } = await supabase
    .from("projects")
    .select("id")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  return { userId: user.id, orgId, projectId: project?.id ?? null, isDemo: false };
});

async function createOrgForUser(userId: string, displayName: string): Promise<string> {
  const supabase = createServiceClient();
  const baseSlug = slugify(displayName) || "workspace";
  const slug = `${baseSlug}-${userId.slice(-6).toLowerCase()}`;

  const { data: org, error } = await supabase
    .from("organizations")
    .insert({ name: `${displayName}'s Workspace`, slug })
    .select("id")
    .single();
  if (error) throw error;

  await supabase.from("organization_members").insert({ organization_id: org.id, user_id: userId, role: "owner" });
  await supabase.from("users").update({ default_org_id: org.id }).eq("id", userId);

  return org.id;
}

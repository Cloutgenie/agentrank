import { cache } from "react";
import { cookies } from "next/headers";
import { currentUser } from "@clerk/nextjs/server";
import { createServiceClient } from "@/lib/supabase/server";
import { isClerkConfigured } from "@/lib/clerk-configured";
import { slugify } from "@/lib/utils";
import { DEMO_ORG_ID, DEMO_PROJECT_ID, getSubscription } from "@/lib/queries";
import { PLAN_LIMITS, limitOrSentinel } from "@/lib/plan-limits";

const ACTIVE_PROJECT_COOKIE = "active_project_id";

export interface CurrentContext {
  userId: string | null;
  orgId: string;
  /** null means the org exists but hasn't onboarded a project yet. */
  projectId: string | null;
  /** Every non-archived project under the org, oldest first. */
  projects: { id: string; name: string }[];
  /** How many projects this org's plan allows; a very large number means unlimited. */
  projectsLimit: number;
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
    return {
      userId: null,
      orgId: DEMO_ORG_ID,
      projectId: DEMO_PROJECT_ID,
      projects: [{ id: DEMO_PROJECT_ID, name: "Agent Rank Radar" }],
      projectsLimit: limitOrSentinel(PLAN_LIMITS.starter.projects),
      isDemo: true,
    };
  }

  const user = await currentUser();
  if (!user) {
    // Shouldn't happen — middleware protects every /dashboard route once
    // Clerk is configured — but fall back rather than crash the page.
    return {
      userId: null,
      orgId: DEMO_ORG_ID,
      projectId: DEMO_PROJECT_ID,
      projects: [{ id: DEMO_PROJECT_ID, name: "Agent Rank Radar" }],
      projectsLimit: limitOrSentinel(PLAN_LIMITS.starter.projects),
      isDemo: true,
    };
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

  const [{ data: projects }, subscription] = await Promise.all([
    supabase
      .from("projects")
      .select("id, name")
      .eq("organization_id", orgId)
      .eq("is_archived", false)
      .order("created_at", { ascending: true }),
    getSubscription(orgId),
  ]);

  const projectList = projects ?? [];
  const cookieStore = await cookies();
  const activeCookieId = cookieStore.get(ACTIVE_PROJECT_COOKIE)?.value;
  const activeProject = projectList.find((p: { id: string }) => p.id === activeCookieId) ?? projectList[0];

  return {
    userId: user.id,
    orgId,
    projectId: activeProject?.id ?? null,
    projects: projectList,
    projectsLimit: subscription.projectsLimit,
    isDemo: false,
  };
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

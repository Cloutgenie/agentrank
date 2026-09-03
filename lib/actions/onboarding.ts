"use server";

import { cookies } from "next/headers";
import { createServiceClient } from "@/lib/supabase/server";
import { getCurrentContext } from "@/lib/auth-context";
import { generateBuyerIntentPrompts } from "@/lib/prompts/generator";
import { slugify } from "@/lib/utils";

const ACTIVE_PROJECT_COOKIE = "active_project_id";

interface CreateProjectInput {
  companyName: string;
  websiteUrl: string;
  industry: string;
  competitors: string[];
}

/**
 * Turns the onboarding form into the first real project for the signed-in
 * user's org — this is the missing half of multi-tenancy: getCurrentContext()
 * already auto-creates the org on first login, but nothing previously turned
 * that org's onboarding submission into an actual projects/competitors/
 * prompts row, so every dashboard page just redirected back here forever.
 *
 * Returns a result instead of calling redirect() itself — this is invoked as
 * a direct function call from a client component (not a <form action>), and
 * redirect()'s thrown signal is unreliable to distinguish from a real error
 * across that boundary. The caller navigates on success.
 */
export async function createProjectFromOnboarding(input: CreateProjectInput): Promise<{ ok: true } | { ok: false; error: string }> {
  const context = await getCurrentContext();
  if (context.isDemo) return { ok: true };

  if (context.projects.length >= context.projectsLimit) {
    return { ok: false, error: "You've reached your plan's project limit. Upgrade to add another." };
  }

  const supabase = createServiceClient();
  const baseSlug = slugify(input.companyName) || "project";

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .insert({
      organization_id: context.orgId,
      name: input.companyName,
      slug: baseSlug,
      website_url: input.websiteUrl,
      industry: input.industry,
    })
    .select("id")
    .single();

  // Unique(organization_id, slug) can only collide here on a double-submit
  // of the same onboarding form — that means a project already exists for
  // this org, so treat it as success rather than an error.
  if (projectError?.code === "23505") return { ok: true };
  if (projectError || !project) return { ok: false, error: projectError?.message ?? "Failed to create project" };

  if (input.competitors.length) {
    await supabase.from("competitors").insert(
      input.competitors.map((name, i) => ({
        project_id: project.id,
        name,
        is_primary: i === 0,
      }))
    );
  }

  const prompts = generateBuyerIntentPrompts({
    projectName: input.companyName,
    industry: input.industry,
    competitorNames: input.competitors,
  });

  if (prompts.length) {
    await supabase.from("prompts").insert(
      prompts.map((p) => ({
        project_id: project.id,
        text: p.text,
        category: p.category,
        source: "auto_generated",
      }))
    );
  }

  // Land the user on the project they just created, not whichever project
  // was previously active — relevant once an org has more than one.
  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_PROJECT_COOKIE, project.id, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
  });

  return { ok: true };
}

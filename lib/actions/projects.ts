"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { createServiceClient } from "@/lib/supabase/server";
import { getCurrentContext } from "@/lib/auth-context";

const ACTIVE_PROJECT_COOKIE = "active_project_id";

/**
 * Switches which project the dashboard renders. Verifies ownership
 * server-side rather than trusting the client-bound id — the same
 * IDOR-prevention pattern used in lib/actions/recommendations.ts.
 */
export async function setActiveProject(projectId: string) {
  const context = await getCurrentContext();
  const supabase = createServiceClient();

  const { data: project } = await supabase.from("projects").select("organization_id").eq("id", projectId).single();
  if (project?.organization_id !== context.orgId) return;

  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_PROJECT_COOKIE, projectId, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
  });

  revalidatePath("/dashboard", "layout");
}

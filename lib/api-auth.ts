import { createServiceClient } from "@/lib/supabase/server";
import { hashApiKey } from "@/lib/api-keys";
import { GROWTH_PLUS_TIERS } from "@/lib/plan-limits";
import type { PlanTier } from "@/lib/types";

export interface ApiError {
  error: string;
  status: number;
}

/**
 * Authenticates a request to /api/v1/* via `Authorization: Bearer <key>`.
 * Re-checks the org's current plan tier on every call (not just at key
 * creation) so a downgrade cuts off access immediately even though the
 * key row itself still exists.
 */
export async function authenticateApiRequest(request: Request): Promise<{ organizationId: string } | ApiError> {
  const authHeader = request.headers.get("authorization");
  const raw = authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;
  if (!raw) return { error: "Missing API key. Pass it as `Authorization: Bearer <key>`.", status: 401 };

  const supabase = createServiceClient();
  const { data: key } = await supabase
    .from("api_keys")
    .select("id, organization_id, organizations(plan_tier)")
    .eq("key_hash", hashApiKey(raw))
    .is("revoked_at", null)
    .maybeSingle();

  if (!key) return { error: "Invalid or revoked API key.", status: 401 };

  const org = key.organizations as { plan_tier: PlanTier } | { plan_tier: PlanTier }[] | null;
  const planTier = Array.isArray(org) ? org[0]?.plan_tier : org?.plan_tier;
  if (!planTier || !GROWTH_PLUS_TIERS.has(planTier)) {
    return { error: "API access requires a Growth plan or higher.", status: 403 };
  }

  await supabase.from("api_keys").update({ last_used_at: new Date().toISOString() }).eq("id", key.id);

  return { organizationId: key.organization_id };
}

/**
 * Resolves which project an /api/v1/* request is about. Orgs can have
 * multiple projects (see Phase 0 multi-project support) — a request must
 * either name one via ?project=<id> or belong to an org with exactly one.
 */
export async function resolveApiProjectId(request: Request, organizationId: string): Promise<{ projectId: string } | ApiError> {
  const supabase = createServiceClient();
  const { data: projects, error } = await supabase
    .from("projects")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("is_archived", false);
  if (error) return { error: error.message, status: 500 };
  if (!projects?.length) return { error: "No projects found for this API key's organization.", status: 404 };

  const requested = new URL(request.url).searchParams.get("project");
  if (requested) {
    const match = projects.find((p: { id: string }) => p.id === requested);
    if (!match) return { error: "That project doesn't belong to this API key's organization.", status: 404 };
    return { projectId: match.id };
  }

  if (projects.length > 1) {
    return { error: "This organization has multiple projects — pass ?project=<id>. See GET /api/v1/projects.", status: 400 };
  }

  return { projectId: projects[0]!.id };
}

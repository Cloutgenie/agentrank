import { NextResponse } from "next/server";
import { authenticateApiRequest, resolveApiProjectId } from "@/lib/api-auth";
import { getCompetitorComparison } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await authenticateApiRequest(request);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const resolved = await resolveApiProjectId(request, auth.organizationId);
  if ("error" in resolved) return NextResponse.json({ error: resolved.error }, { status: resolved.status });

  const comparison = await getCompetitorComparison(resolved.projectId);
  return NextResponse.json({ data: comparison });
}

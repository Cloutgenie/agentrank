import { NextResponse } from "next/server";
import { authenticateApiRequest } from "@/lib/api-auth";
import { createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await authenticateApiRequest(request);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const supabase = createServiceClient();
  const { data: projects, error } = await supabase
    .from("projects")
    .select("id, name, slug")
    .eq("organization_id", auth.organizationId)
    .eq("is_archived", false)
    .order("created_at", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data: projects ?? [] });
}

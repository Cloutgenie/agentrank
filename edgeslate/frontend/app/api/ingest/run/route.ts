import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST() {
  return NextResponse.json({
    ok: true,
    message: "Live odds are fetched on demand from The Odds API (no batch ingest on Vercel).",
    stats: { mode: "vercel-live" },
  });
}

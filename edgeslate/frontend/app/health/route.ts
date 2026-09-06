import { NextResponse } from "next/server";
import { oddsApiConfigured } from "@/lib/live-odds";

export const dynamic = "force-dynamic";

export async function GET() {
  const live = oddsApiConfigured();
  return NextResponse.json({
    status: "ok",
    demo_mode: !live,
    live_odds: live,
    sport: "NFL",
    sports: ["NFL", "CFB", "NBA"],
  });
}

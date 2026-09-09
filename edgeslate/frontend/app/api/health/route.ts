import { NextResponse } from "next/server";
import { oddsApiConfigured, readOddsKeyPublicMeta } from "@/lib/live-odds";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const live = oddsApiConfigured();
  const meta = readOddsKeyPublicMeta();
  return NextResponse.json({
    status: "ok",
    demo_mode: !live,
    live_odds: live,
    odds_key_configured: meta.configured,
    odds_key_length: meta.length,
    sport: "NFL",
    sports: ["NFL", "CFB", "NBA"],
  });
}

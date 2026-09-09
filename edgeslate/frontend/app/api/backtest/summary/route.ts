import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    total_picks: 0,
    graded_picks: 0,
    wins: 0,
    win_rate: 0,
    avg_edge_pp: 0,
    avg_model_prob: 0,
    positive_ev: false,
    launch_ready: false,
    calibration: [],
    notes: "Live mode: graded history requires the FastAPI + Postgres backend.",
  });
}

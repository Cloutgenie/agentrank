import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST() {
  return NextResponse.json({
    ok: false,
    message: "Demo seed disabled — this deployment uses live Odds API data.",
  });
}

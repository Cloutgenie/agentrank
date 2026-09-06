import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  // DFS boards need PrizePicks/Underdog scrape + backend DB — not available on Vercel-only live path yet.
  return NextResponse.json([]);
}

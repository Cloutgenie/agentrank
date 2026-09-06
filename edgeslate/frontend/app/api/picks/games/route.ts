import { NextRequest, NextResponse } from "next/server";
import { fetchLiveGamePicks, type SportId } from "@/lib/live-odds";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function normalizeSport(value: string | null): SportId {
  const s = (value || "NFL").toUpperCase();
  if (s === "NBA" || s === "NFL" || s === "CFB") return s;
  if (s === "NCAAF") return "CFB";
  return "NFL";
}

export async function GET(req: NextRequest) {
  const sport = normalizeSport(req.nextUrl.searchParams.get("sport"));
  try {
    const { picks, source, event_count } = await fetchLiveGamePicks(sport);
    if (source === "unconfigured") {
      return NextResponse.json(
        {
          error: "ODDS_API_KEY is not set on this deployment",
          hint: "Add ODDS_API_KEY in the Vercel project → Settings → Environment Variables, then Redeploy.",
          sport,
        },
        { status: 503 }
      );
    }
    const res = NextResponse.json(picks);
    res.headers.set("x-edgeslate-source", "live");
    res.headers.set("x-edgeslate-events", String(event_count));
    return res;
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to fetch live odds";
    return NextResponse.json({ error: message, sport }, { status: 502 });
  }
}

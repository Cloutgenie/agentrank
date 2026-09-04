import { NextResponse } from "next/server";
import { z } from "zod";
import { DEFAULT_RISK, scanForPlays } from "@/lib/desk";

export const dynamic = "force-dynamic";

const BodySchema = z.object({
  accountEquity: z.number().positive().optional(),
  riskPerTrade: z.number().min(0.005).max(0.05).optional(),
  dailyLossLimit: z.number().min(0.01).max(0.1).optional(),
  dayPnl: z.number().optional(),
  includeDangerScenario: z.boolean().optional(),
});

/**
 * POST /api/desk/scan
 * Runs the rules engine and returns desk plays (entry / TP / SL / exit-by).
 */
export async function POST(req: Request) {
  let body: z.infer<typeof BodySchema> = {};
  try {
    const json = await req.json().catch(() => ({}));
    body = BodySchema.parse(json);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Invalid body" },
      { status: 400 }
    );
  }

  const risk = {
    accountEquity: body.accountEquity ?? DEFAULT_RISK.accountEquity,
    riskPerTrade: body.riskPerTrade ?? DEFAULT_RISK.riskPerTrade,
    dailyLossLimit: body.dailyLossLimit ?? DEFAULT_RISK.dailyLossLimit,
    dayPnl: body.dayPnl ?? DEFAULT_RISK.dayPnl,
  };

  const result = scanForPlays({
    risk,
    includeDangerScenario: body.includeDangerScenario,
  });

  return NextResponse.json({
    primary: result.primary,
    plays: result.plays,
    refusedMessage: result.refusedMessage,
    risk,
    generatedAt: new Date().toISOString(),
  });
}

export async function GET() {
  const result = scanForPlays({ risk: DEFAULT_RISK });
  return NextResponse.json({
    primary: result.primary,
    plays: result.plays,
    refusedMessage: result.refusedMessage,
    risk: DEFAULT_RISK,
    generatedAt: new Date().toISOString(),
  });
}

import { NextResponse } from "next/server";
import { z } from "zod";
import {
  DEFAULT_STARTING_MONEY,
  riskFromStartingMoney,
  scanForPlays,
} from "@/lib/desk";

export const dynamic = "force-dynamic";

const BodySchema = z.object({
  /** Starting money — what the user puts in (e.g. 100). Sizes the one play. */
  startingMoney: z.number().positive().optional(),
  accountEquity: z.number().positive().optional(),
  riskPerTrade: z.number().min(0.005).max(1).optional(),
  dailyLossLimit: z.number().min(0.01).max(1).optional(),
  dayPnl: z.number().optional(),
  includeDangerScenario: z.boolean().optional(),
});

/**
 * POST /api/desk/scan
 * Enter starting money → desk finds Call or Put (Buy · TP · SL).
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

  const startingMoney = body.startingMoney ?? body.accountEquity ?? DEFAULT_STARTING_MONEY;
  const risk = {
    ...riskFromStartingMoney(startingMoney),
    ...(body.riskPerTrade !== undefined ? { riskPerTrade: body.riskPerTrade } : {}),
    ...(body.dailyLossLimit !== undefined ? { dailyLossLimit: body.dailyLossLimit } : {}),
    dayPnl: body.dayPnl ?? 0,
  };

  const result = scanForPlays({
    risk,
    includeDangerScenario: body.includeDangerScenario,
  });

  return NextResponse.json({
    primary: result.primary,
    plays: result.plays,
    refusedMessage: result.refusedMessage,
    wire: result.wire,
    feed: result.feed,
    liveDataExplainer: result.liveDataExplainer,
    startingMoney,
    risk,
    generatedAt: new Date().toISOString(),
  });
}

export async function GET() {
  const startingMoney = DEFAULT_STARTING_MONEY;
  const risk = riskFromStartingMoney(startingMoney);
  const result = scanForPlays({ risk });
  return NextResponse.json({
    primary: result.primary,
    plays: result.plays,
    refusedMessage: result.refusedMessage,
    wire: result.wire,
    feed: result.feed,
    liveDataExplainer: result.liveDataExplainer,
    startingMoney,
    risk,
    generatedAt: new Date().toISOString(),
  });
}

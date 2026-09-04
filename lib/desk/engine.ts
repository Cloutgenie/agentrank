import { defineExits } from "./exits";
import { demoDangerMarket, demoMarket, DEFAULT_RISK, legsSummary, structureLabel } from "./market";
import { classifyRegime } from "./regime";
import { sizePosition } from "./sizing";
import { selectStructure } from "./structure";
import { buildStructure } from "./strikes";
import type { DeskPlay, MarketSnapshot, RiskLimits } from "./types";

export interface EngineInput {
  market: MarketSnapshot;
  risk?: RiskLimits;
}

export interface EngineResult {
  play: DeskPlay | null;
  refused: boolean;
  message: string;
}

export function runRulesEngine(input: EngineInput): EngineResult {
  const risk = input.risk ?? DEFAULT_RISK;
  const regime = classifyRegime(input.market);

  if (regime.regime === "refuse" || !regime.allowPremiumSale) {
    return {
      play: null,
      refused: true,
      message: regime.reasons[0] ?? "Regime refused — no trade",
    };
  }

  const plan = selectStructure(input.market, regime);
  if (plan.kind === "no_trade") {
    return { play: null, refused: true, message: plan.reason };
  }

  const budgetMaxLoss = risk.accountEquity * risk.riskPerTrade * regime.sizeMultiplier;
  const structure = buildStructure(input.market, plan, { budgetMaxLoss });
  if (!structure) {
    return { play: null, refused: true, message: "Could not build defined-risk structure from chain" };
  }

  const size = sizePosition(structure, risk, regime.sizeMultiplier);
  if (size.blocked || size.contracts < 1) {
    return {
      play: null,
      refused: true,
      message: size.blockReason ?? "Position sizing blocked",
    };
  }

  const exits = defineExits(structure, input.market.sessionProgress);
  const maxLoss = structure.maxLossPerContract * size.contracts;
  const title = `${structureLabel(structure.kind)} · ${legsSummary(structure.legs)}`;

  const play: DeskPlay = {
    id: `play-${input.market.symbol}-${structure.kind}-${structure.legs.map((l) => l.strike).join("-")}`,
    symbol: input.market.symbol,
    title,
    structure,
    size,
    exits,
    regime,
    plan,
    ticket: {
      action: "SELL_TO_OPEN",
      entry: structure.credit,
      takeProfit: exits.takeProfitPrice,
      stopLoss: exits.stopLossPrice,
      exitBy: exits.timeExitEt,
      contracts: size.contracts,
      maxLoss: Math.round(maxLoss * 100) / 100,
      summary: `Sell ${size.contracts}× for $${structure.credit.toFixed(2)} credit · TP $${exits.takeProfitPrice.toFixed(2)} · SL $${exits.stopLossPrice.toFixed(2)} · flat by ${exits.timeExitEt}`,
    },
    asOf: input.market.asOf,
    rank: 1,
  };

  return { play, refused: false, message: plan.reason };
}

export function scanForPlays(opts?: {
  risk?: RiskLimits;
  includeDangerScenario?: boolean;
}): {
  plays: DeskPlay[];
  primary: DeskPlay | null;
  refusedMessage?: string;
  wire: {
    headlines: string[];
    putCallRatio: number;
    flowBias: string;
    headlineScore: number;
    events: { code: string; label: string; impact: string; minutesUntil: number }[];
  };
} {
  const risk = opts?.risk ?? DEFAULT_RISK;
  const lead = demoMarket();
  const scenarios: MarketSnapshot[] = [
    lead,
    demoMarket({
      symbol: "SPY",
      underlying: 562.4,
      vwap: 561.9,
      orHigh: 563.2,
      orLow: 560.8,
      vix: 14.8,
      gex: 1.8e9,
      asOf: "10:42 ET",
    }),
    demoMarket({
      symbol: "SPX",
      underlying: 5602,
      vwap: 5618,
      orHigh: 5625,
      orLow: 5600,
      vix: 16.2,
      gex: 0.9e9,
      asOf: "10:55 ET",
      sessionProgress: 0.4,
    }),
  ];

  if (opts?.includeDangerScenario) scenarios.push(demoDangerMarket());

  const plays: DeskPlay[] = [];
  let refusedMessage: string | undefined;

  for (const market of scenarios) {
    const result = runRulesEngine({ market, risk });
    if (result.play) plays.push({ ...result.play, rank: plays.length + 1 });
    else if (!refusedMessage) refusedMessage = `${market.symbol}: ${result.message}`;
  }

  const sentiment = lead.sentiment ?? {
    headlines: [],
    putCallRatio: 1,
    flowBias: "neutral" as const,
    headlineScore: 0,
    events: [],
  };

  const primary = plays[0] ?? null;
  return {
    plays,
    primary,
    refusedMessage: primary ? undefined : refusedMessage,
    wire: {
      headlines: sentiment.headlines,
      putCallRatio: sentiment.putCallRatio,
      flowBias: sentiment.flowBias,
      headlineScore: sentiment.headlineScore,
      events: sentiment.events,
    },
  };
}

export { demoMarket, demoDangerMarket, DEFAULT_RISK };

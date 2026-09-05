import { defineExits } from "./exits";
import { demoFeedStatus, explainLiveData, type FeedStatus } from "./feed";
import { demoDangerMarket, demoMarket, DEFAULT_RISK, structureLabel } from "./market";
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
    return {
      play: null,
      refused: true,
      message: "No Call/Put fits this bankroll on today’s chain",
    };
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
  const strike = structure.legs[0]?.strike ?? 0;
  const title = `${structureLabel(structure.kind)} · $${strike}`;

  const play: DeskPlay = {
    id: `play-${input.market.symbol}-${structure.kind}-${strike}`,
    symbol: input.market.symbol,
    side: structure.side,
    title,
    structure,
    size,
    exits,
    regime,
    plan,
    ticket: {
      action: "BUY_TO_OPEN",
      entry: structure.debit,
      takeProfit: exits.takeProfitPrice,
      stopLoss: exits.stopLossPrice,
      exitBy: exits.timeExitEt,
      contracts: size.contracts,
      maxLoss: Math.round(maxLoss * 100) / 100,
      strike,
      summary: `Buy ${size.contracts}× ${input.market.symbol} ${structure.side} $${strike} @ $${structure.debit.toFixed(2)} · TP $${exits.takeProfitPrice.toFixed(2)} · SL $${exits.stopLossPrice.toFixed(2)} · flat by ${exits.timeExitEt}`,
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
  feed: FeedStatus;
  liveDataExplainer: string;
  wire: {
    headlines: string[];
    putCallRatio: number;
    flowBias: string;
    headlineScore: number;
    events: { code: string; label: string; impact: string; minutesUntil: number }[];
  };
} {
  const risk = opts?.risk ?? DEFAULT_RISK;
  const spy = demoMarket({
    symbol: "SPY",
    underlying: 562.4,
    vwap: 561.9,
    orHigh: 563.2,
    orLow: 560.8,
    vix: 14.8,
    gex: 1.8e9,
    asOf: "10:42 ET",
  });
  const spx = demoMarket();
  const spxAlt = demoMarket({
    symbol: "SPX",
    underlying: 5602,
    vwap: 5618,
    orHigh: 5625,
    orLow: 5600,
    vix: 16.2,
    gex: 0.9e9,
    asOf: "10:55 ET",
    sessionProgress: 0.4,
  });
  const lead = risk.accountEquity < 5000 ? spy : spx;
  const scenarios: MarketSnapshot[] =
    risk.accountEquity < 5000 ? [spy, spx, spxAlt] : [spx, spy, spxAlt];

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
    feed: demoFeedStatus(lead.asOf),
    liveDataExplainer: explainLiveData(),
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

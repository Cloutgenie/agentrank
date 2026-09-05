import { defineExits } from "./exits";
import {
  explainLiveData,
  fetchLiveMarket,
  LiveFeedError,
  type FeedStatus,
} from "./feed";
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

  const exits = defineExits(structure, input.market.sessionProgress, input.market.asOf);
  if (exits.takeAt.startsWith("Too late")) {
    return {
      play: null,
      refused: true,
      message: exits.takeAt + " — no new 0DTE entries",
    };
  }
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
      takeAt: exits.takeAt,
      enterBy: exits.enterBy,
      exitBy: exits.timeExitEt,
      contracts: size.contracts,
      maxLoss: Math.round(maxLoss * 100) / 100,
      strike,
      summary: `Take ${exits.takeAt} · open by ${exits.enterBy} · Buy ${size.contracts}× ${input.market.symbol} ${structure.side} $${strike} @ $${structure.debit.toFixed(2)} · TP $${exits.takeProfitPrice.toFixed(2)} · SL $${exits.stopLossPrice.toFixed(2)} · flat by ${exits.timeExitEt}`,
    },
    asOf: input.market.asOf,
    rank: 1,
  };

  return { play, refused: false, message: plan.reason };
}

export type ScanResult = {
  plays: DeskPlay[];
  primary: DeskPlay | null;
  refusedMessage?: string;
  feed: FeedStatus | null;
  feedError?: string;
  liveDataExplainer: string;
  wire: {
    headlines: string[];
    putCallRatio: number;
    flowBias: string;
    headlineScore: number;
    events: { code: string; label: string; impact: string; minutesUntil: number }[];
  };
};

/**
 * LIVE-ONLY scan. Fetches the public/vendor tape and runs the Call/Put engine.
 * Never falls back to demo quotes.
 */
export async function scanForPlays(opts?: {
  risk?: RiskLimits;
  symbol?: string;
}): Promise<ScanResult> {
  const risk = opts?.risk ?? DEFAULT_RISK;
  const symbol = opts?.symbol ?? "SPY";
  const liveDataExplainer = explainLiveData();

  let market: MarketSnapshot;
  let feed: FeedStatus;

  try {
    const live = await fetchLiveMarket(symbol);
    market = live.market;
    feed = live.feed;
  } catch (err) {
    const message =
      err instanceof LiveFeedError
        ? err.message
        : err instanceof Error
          ? err.message
          : "Live tape unavailable";
    return {
      plays: [],
      primary: null,
      refusedMessage: message,
      feed: null,
      feedError: message,
      liveDataExplainer,
      wire: {
        headlines: [message],
        putCallRatio: 1,
        flowBias: "neutral",
        headlineScore: 0,
        events: [],
      },
    };
  }

  const result = runRulesEngine({ market, risk });
  const plays = result.play ? [{ ...result.play, rank: 1 }] : [];
  const sentiment = market.sentiment;

  return {
    plays,
    primary: plays[0] ?? null,
    refusedMessage: result.play ? undefined : result.message,
    feed,
    liveDataExplainer,
    wire: {
      headlines: sentiment?.headlines ?? [`Live ${market.symbol} ${market.underlying}`],
      putCallRatio: sentiment?.putCallRatio ?? 1,
      flowBias: sentiment?.flowBias ?? "neutral",
      headlineScore: sentiment?.headlineScore ?? 0,
      events: sentiment?.events ?? [],
    },
  };
}

export { demoMarket, demoDangerMarket, DEFAULT_RISK };

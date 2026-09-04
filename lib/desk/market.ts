import { SETTINGS } from "./brand";
import { inferGexSign } from "./regime";
import { demoSentiment } from "./sentiment";
import { synthesizeChain } from "./strikes";
import type { MarketSnapshot, RiskLimits } from "./types";

export function demoMarket(overrides?: Partial<MarketSnapshot>): MarketSnapshot {
  const underlying = overrides?.underlying ?? 5624.5;
  const gex = overrides?.gex ?? 2.4e9;
  const base: MarketSnapshot = {
    symbol: "SPX",
    underlying,
    vwap: overrides?.vwap ?? 5619.2,
    vix: overrides?.vix ?? 14.8,
    gex,
    gexSign: inferGexSign(gex),
    orHigh: overrides?.orHigh ?? 5632,
    orLow: overrides?.orLow ?? 5608,
    sessionProgress: overrides?.sessionProgress ?? 0.35,
    asOf: overrides?.asOf ?? "10:42 ET",
    chain: [],
    sentiment: overrides?.sentiment ?? demoSentiment(),
  };
  const merged = { ...base, ...overrides, gexSign: inferGexSign(overrides?.gex ?? gex) };
  if (!merged.chain.length) merged.chain = synthesizeChain(merged);
  if (!merged.sentiment) merged.sentiment = demoSentiment();
  return merged;
}

export function demoDangerMarket(): MarketSnapshot {
  return demoMarket({
    vix: 27.4,
    gex: -3.1e9,
    underlying: 5580,
    vwap: 5605,
    orHigh: 5610,
    orLow: 5570,
    asOf: "11:05 ET",
    sessionProgress: 0.42,
  });
}

export const DEFAULT_RISK: RiskLimits = {
  accountEquity: 100_000,
  riskPerTrade: SETTINGS.riskPerTrade,
  dailyLossLimit: SETTINGS.dailyLossLimit,
  dayPnl: 0,
};

export function structureLabel(kind: string): string {
  switch (kind) {
    case "bull_put_vertical":
      return "Bull put vertical";
    case "bear_call_vertical":
      return "Bear call vertical";
    case "iron_condor":
      return "Iron condor";
    default:
      return "No trade";
  }
}

export function legsSummary(legs: { side: string; right: string; strike: number }[]): string {
  return legs
    .map((l) => `${l.side === "short" ? "−" : "+"}${l.right}${l.strike}`)
    .join(" / ");
}

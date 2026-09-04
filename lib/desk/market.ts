import { inferGexSign } from "./regime";
import { synthesizeChain } from "./strikes";
import type { MarketSnapshot, RiskLimits } from "./types";

/** Demo SPX-like session used when live quote feeds aren't connected. */
export function demoMarket(overrides?: Partial<MarketSnapshot>): MarketSnapshot {
  const underlying = overrides?.underlying ?? 5624.5;
  const orLow = overrides?.orLow ?? 5608;
  const orHigh = overrides?.orHigh ?? 5632;
  const vwap = overrides?.vwap ?? 5619.2;
  const vix = overrides?.vix ?? 14.8;
  const gex = overrides?.gex ?? 2.4e9;
  const base: MarketSnapshot = {
    symbol: "SPX",
    underlying,
    vwap,
    vix,
    gex,
    gexSign: inferGexSign(gex),
    orHigh,
    orLow,
    sessionProgress: 0.35,
    asOf: "10:42 ET",
    chain: [],
  };
  const merged = { ...base, ...overrides };
  if (!merged.chain.length) merged.chain = synthesizeChain(merged);
  return merged;
}

/** Alternate scenario: negative GEX / hot VIX — engine should refuse or cut. */
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
  riskPerTrade: 0.015,
  dailyLossLimit: 0.03,
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

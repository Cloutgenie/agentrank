import type { MarketSnapshot, RegimeResult, StructurePlan } from "./types";

/**
 * Robinhood-simple: only Call or Put.
 * Call = bullish · Put = bearish.
 */
export function selectStructure(
  m: MarketSnapshot,
  regime: RegimeResult,
  _opts?: { preferVertical?: boolean }
): StructurePlan {
  if (regime.regime === "refuse" || !regime.allowPremiumSale) {
    return {
      kind: "no_trade",
      bias: "none",
      reason: "Regime refused — sit on hands",
    };
  }

  const aboveVwap = m.underlying >= m.vwap;
  const brokeHigh = m.underlying > m.orHigh;
  const brokeLow = m.underlying < m.orLow;

  if (brokeHigh || (aboveVwap && regime.regime !== "range")) {
    return {
      kind: "call",
      bias: "bullish",
      reason: brokeHigh ? "Broke highs → Call" : "Above VWAP → Call",
    };
  }

  if (brokeLow || !aboveVwap) {
    return {
      kind: "put",
      bias: "bearish",
      reason: brokeLow ? "Broke lows → Put" : "Below VWAP → Put",
    };
  }

  const mid = (m.orHigh + m.orLow) / 2;
  if (m.underlying >= mid) {
    return { kind: "call", bias: "bullish", reason: "Range bias up → Call" };
  }
  return { kind: "put", bias: "bearish", reason: "Range bias down → Put" };
}

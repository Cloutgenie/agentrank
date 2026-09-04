import type { MarketSnapshot, RegimeResult, StructurePlan } from "./types";

export function selectStructure(
  m: MarketSnapshot,
  regime: RegimeResult,
  opts?: { preferVertical?: boolean }
): StructurePlan {
  if (regime.regime === "refuse" || !regime.allowPremiumSale) {
    return {
      kind: "no_trade",
      bias: "none",
      reason: "Regime refused premium sales — sit on hands",
    };
  }

  const aboveVwap = m.underlying >= m.vwap;
  const brokeHigh = m.underlying > m.orHigh;
  const brokeLow = m.underlying < m.orLow;

  // Small starting bankrolls: single vertical keeps max loss inside the budget.
  if (opts?.preferVertical || regime.regime === "vol_expansion") {
    if (brokeHigh || (aboveVwap && regime.regime !== "range")) {
      return {
        kind: "bear_call_vertical",
        bias: "bearish",
        reason: opts?.preferVertical
          ? "Starter bankroll → defined-risk call credit vertical"
          : "Vol expansion into highs → defined-risk call credit vertical",
      };
    }
    if (brokeLow || !aboveVwap || opts?.preferVertical) {
      return {
        kind: "bull_put_vertical",
        bias: "bullish",
        reason: opts?.preferVertical
          ? "Starter bankroll → defined-risk put credit vertical"
          : "Vol expansion into lows → defined-risk put credit vertical",
      };
    }
  }

  if (regime.regime === "range") {
    return {
      kind: "iron_condor",
      bias: "neutral",
      reason: "Range day → iron condor, defined risk both sides",
    };
  }

  if (brokeLow || (!aboveVwap && m.underlying < m.orLow + (m.orHigh - m.orLow) * 0.25)) {
    return {
      kind: "bear_call_vertical",
      bias: "bearish",
      reason: "Trend down / below VWAP → bear call vertical",
    };
  }

  return {
    kind: "bull_put_vertical",
    bias: "bullish",
    reason: "Trend up / above VWAP → bull put vertical",
  };
}

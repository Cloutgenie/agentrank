import type { MarketSnapshot, RegimeResult, StructurePlan } from "./types";

/**
 * Defined risk only. Vertical spreads or iron condors.
 * Ninety-two percent of SPX 0DTE volume is capped-risk for a reason.
 */
export function selectStructure(m: MarketSnapshot, regime: RegimeResult): StructurePlan {
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

  if (regime.regime === "range") {
    return {
      kind: "iron_condor",
      bias: "neutral",
      reason: "Range day → iron condor, defined risk both sides",
    };
  }

  if (regime.regime === "vol_expansion") {
    // In vol expansion, prefer a single vertical with the trend / fade of extreme
    if (brokeHigh || aboveVwap) {
      return {
        kind: "bear_call_vertical",
        bias: "bearish",
        reason: "Vol expansion into highs → defined-risk call credit vertical",
      };
    }
    return {
      kind: "bull_put_vertical",
      bias: "bullish",
      reason: "Vol expansion into lows → defined-risk put credit vertical",
    };
  }

  // Trend
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

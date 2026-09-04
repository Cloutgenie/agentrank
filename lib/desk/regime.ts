import type { GexSign, MarketSnapshot, RegimeResult } from "./types";

/**
 * Regime first.
 * Classify the day — trend, range, or volatility expansion —
 * using VIX, opening range, and GEX.
 * Negative GEX + 0DTE gamma is where accounts die: cut size or refuse premium sales.
 */
export function classifyRegime(m: MarketSnapshot): RegimeResult {
  const reasons: string[] = [];
  const orWidth = m.orHigh - m.orLow;
  const orMid = (m.orHigh + m.orLow) / 2;
  const breakoutUp = m.underlying > m.orHigh;
  const breakoutDown = m.underlying < m.orLow;
  const insideOr = !breakoutUp && !breakoutDown;
  const rangePct = orMid > 0 ? orWidth / orMid : 0;

  const vixElevated = m.vix >= 20;
  const vixHot = m.vix >= 25;
  const negativeGex = m.gexSign === "negative" || m.gex < 0;
  const positiveGex = m.gexSign === "positive" || m.gex > 0;

  // Hard refuse: negative GEX + elevated VIX = dealer short-gamma feedback loop
  if (negativeGex && vixHot) {
    reasons.push(`Negative GEX (${fmtGex(m.gex)}) with VIX ${m.vix.toFixed(1)} — refuse premium sales`);
    reasons.push("0DTE gamma + short dealer gamma is where accounts die");
    return { regime: "refuse", reasons, sizeMultiplier: 0, allowPremiumSale: false };
  }

  if (negativeGex && vixElevated) {
    reasons.push(`Negative GEX + VIX ${m.vix.toFixed(1)} — cut size hard, prefer defined-risk only`);
    return {
      regime: "vol_expansion",
      reasons,
      sizeMultiplier: 0.35,
      allowPremiumSale: true, // still defined-risk only downstream
    };
  }

  if (vixHot || (vixElevated && rangePct > 0.006)) {
    reasons.push(`VIX ${m.vix.toFixed(1)} and OR width ${(rangePct * 100).toFixed(2)}% → volatility expansion`);
    return {
      regime: "vol_expansion",
      reasons,
      sizeMultiplier: negativeGex ? 0.4 : 0.65,
      allowPremiumSale: true,
    };
  }

  if ((breakoutUp || breakoutDown) && positiveGex) {
    reasons.push(
      breakoutUp
        ? `Price broke OR high ${m.orHigh.toFixed(2)} with positive GEX — trend day`
        : `Price broke OR low ${m.orLow.toFixed(2)} with positive GEX — trend day`
    );
    return { regime: "trend", reasons, sizeMultiplier: 1, allowPremiumSale: true };
  }

  if (insideOr || rangePct < 0.004) {
    reasons.push(
      insideOr
        ? `Inside opening range ${m.orLow.toFixed(2)}–${m.orHigh.toFixed(2)} — range day`
        : `Tight OR (${(rangePct * 100).toFixed(2)}%) — range day`
    );
    if (positiveGex) reasons.push("Positive GEX supports mean-reversion / premium structures");
    return {
      regime: "range",
      reasons,
      sizeMultiplier: negativeGex ? 0.5 : 1,
      allowPremiumSale: true,
    };
  }

  // Default: soft trend / transitional
  reasons.push("OR break without clear vol signature — treat as trend with reduced size");
  return {
    regime: "trend",
    reasons,
    sizeMultiplier: negativeGex ? 0.5 : 0.85,
    allowPremiumSale: true,
  };
}

export function inferGexSign(gex: number): GexSign {
  if (gex > 1e8) return "positive";
  if (gex < -1e8) return "negative";
  return "neutral";
}

function fmtGex(gex: number): string {
  const abs = Math.abs(gex);
  if (abs >= 1e9) return `${(gex / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${(gex / 1e6).toFixed(0)}M`;
  return gex.toFixed(0);
}

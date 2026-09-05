import { SETTINGS } from "./brand";
import { evaluateSentiment } from "./sentiment";
import type { GexSign, MarketSnapshot, RegimeResult } from "./types";

export function classifyRegime(m: MarketSnapshot): RegimeResult {
  const reasons: string[] = [];
  const sentimentNotes: string[] = [];
  let sentimentMult = 1;

  if (m.sentiment) {
    const gate = evaluateSentiment(m.sentiment);
    sentimentNotes.push(...gate.reasons);
    sentimentMult = gate.sizeMultiplier;
    if (!gate.allowPremiumSale || gate.blackout) {
      reasons.push(...gate.reasons);
      return {
        regime: "refuse",
        reasons,
        sizeMultiplier: 0,
        allowPremiumSale: false,
        sentimentNotes,
        newsBlackout: gate.blackout,
      };
    }
  }

  const orWidth = m.orHigh - m.orLow;
  const orMid = (m.orHigh + m.orLow) / 2;
  const breakoutUp = m.underlying > m.orHigh;
  const breakoutDown = m.underlying < m.orLow;
  const insideOr = !breakoutUp && !breakoutDown;
  const rangePct = orMid > 0 ? orWidth / orMid : 0;
  const vixElevated = m.vix >= SETTINGS.vixElevated;
  const vixHot = m.vix >= SETTINGS.vixHot;
  const negativeGex = m.gexSign === "negative" || m.gex < 0;
  const positiveGex = m.gexSign === "positive" || m.gex > 0;

  if (negativeGex && vixHot) {
    reasons.push(
      `Negative GEX (${fmtGex(m.gex)}) with VIX ${m.vix.toFixed(1)} — no Call / Put`
    );
    reasons.push("0DTE gamma + short dealer gamma is where accounts die");
    return {
      regime: "refuse",
      reasons,
      sizeMultiplier: 0,
      allowPremiumSale: false,
      sentimentNotes,
    };
  }

  if (negativeGex && vixElevated) {
    reasons.push(`Negative GEX + VIX ${m.vix.toFixed(1)} — cut size hard`);
    return {
      regime: "vol_expansion",
      reasons,
      sizeMultiplier: 0.35 * sentimentMult,
      allowPremiumSale: true,
      sentimentNotes,
    };
  }

  if (vixHot || (vixElevated && rangePct > 0.006)) {
    reasons.push(
      `VIX ${m.vix.toFixed(1)} and OR width ${(rangePct * 100).toFixed(2)}% → volatility expansion`
    );
    return {
      regime: "vol_expansion",
      reasons,
      sizeMultiplier: (negativeGex ? 0.4 : 0.65) * sentimentMult,
      allowPremiumSale: true,
      sentimentNotes,
    };
  }

  if ((breakoutUp || breakoutDown) && positiveGex) {
    reasons.push(
      breakoutUp
        ? `Broke OR high ${m.orHigh.toFixed(2)} with positive GEX — trend day`
        : `Broke OR low ${m.orLow.toFixed(2)} with positive GEX — trend day`
    );
    return {
      regime: "trend",
      reasons,
      sizeMultiplier: sentimentMult,
      allowPremiumSale: true,
      sentimentNotes,
    };
  }

  if (insideOr || rangePct < 0.004) {
    reasons.push(
      insideOr
        ? `Inside opening range ${m.orLow.toFixed(2)}–${m.orHigh.toFixed(2)} — range day`
        : `Tight OR (${(rangePct * 100).toFixed(2)}%) — range day`
    );
    if (positiveGex) reasons.push("Positive GEX — lean with VWAP for Call or Put");
    return {
      regime: "range",
      reasons,
      sizeMultiplier: (negativeGex ? 0.5 : 1) * sentimentMult,
      allowPremiumSale: true,
      sentimentNotes,
    };
  }

  reasons.push("OR break without clear vol signature — trend with reduced size");
  return {
    regime: "trend",
    reasons,
    sizeMultiplier: (negativeGex ? 0.5 : 0.85) * sentimentMult,
    allowPremiumSale: true,
    sentimentNotes,
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

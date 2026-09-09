import { SETTINGS } from "./brand";
import type { MarketSnapshot } from "./types";

export type NewsImpact = "high" | "medium" | "low";
export type FlowBias = "bullish" | "bearish" | "neutral";

export interface NewsEvent {
  code: string;
  label: string;
  impact: NewsImpact;
  minutesUntil: number;
}

export interface SentimentSnapshot {
  headlineScore: number;
  headlines: string[];
  putCallRatio: number;
  flowBias: FlowBias;
  events: NewsEvent[];
}

export interface SentimentGate {
  allowPremiumSale: boolean;
  sizeMultiplier: number;
  reasons: string[];
  blackout: boolean;
}

export function evaluateSentiment(s: SentimentSnapshot): SentimentGate {
  const reasons: string[] = [];
  let sizeMultiplier = 1;
  let allowPremiumSale = true;
  let blackout = false;

  for (const ev of s.events) {
    const isBlackout = (SETTINGS.newsBlackoutEvents as readonly string[]).includes(ev.code);
    const inWindow = ev.minutesUntil >= -30 && ev.minutesUntil <= 90;
    if (ev.impact === "high" && isBlackout && inWindow) {
      blackout = true;
      allowPremiumSale = false;
      sizeMultiplier = 0;
      reasons.push(
        `${ev.label} blackout (${ev.minutesUntil > 0 ? `in ${ev.minutesUntil}m` : "just printed"}) — no premium sales`
      );
    }
  }

  if (blackout) return { allowPremiumSale, sizeMultiplier, reasons, blackout };

  if (Math.abs(s.headlineScore) >= SETTINGS.headlineRefuseAbs) {
    return {
      allowPremiumSale: false,
      sizeMultiplier: 0,
      reasons: [
        `Headline sentiment ${s.headlineScore.toFixed(2)} extreme — refuse until tape cools`,
      ],
      blackout,
    };
  }

  if (Math.abs(s.headlineScore) >= SETTINGS.headlineCutAbs) {
    sizeMultiplier = Math.min(sizeMultiplier, 0.5);
    reasons.push(`Headline sentiment ${s.headlineScore.toFixed(2)} elevated — cut size 50%`);
  }

  if (s.putCallRatio >= SETTINGS.putCallFear) {
    sizeMultiplier = Math.min(sizeMultiplier, 0.5);
    reasons.push(`Put/call ${s.putCallRatio.toFixed(2)} fear extreme — cut size`);
  } else if (s.putCallRatio <= SETTINGS.putCallComplacency) {
    sizeMultiplier = Math.min(sizeMultiplier, 0.75);
    reasons.push(`Put/call ${s.putCallRatio.toFixed(2)} complacent — trim size`);
  }

  if (s.flowBias === "bearish" && s.headlineScore < -0.15) {
    sizeMultiplier = Math.min(sizeMultiplier, 0.65);
    reasons.push("Bearish flow + soft headlines — reduce premium sales");
  }

  if (!reasons.length) {
    reasons.push(
      `Sentiment clear · P/C ${s.putCallRatio.toFixed(2)} · flow ${s.flowBias} · headlines ${s.headlineScore.toFixed(2)}`
    );
  }

  return { allowPremiumSale, sizeMultiplier, reasons, blackout };
}

export function demoSentiment(overrides?: Partial<SentimentSnapshot>): SentimentSnapshot {
  return {
    headlineScore: 0.12,
    headlines: [
      "Futures steady ahead of open; no major data until 14:00 ET",
      "Dealers marked long gamma into the morning auction",
      "Soft overnight tape in Europe, USD firm",
    ],
    putCallRatio: 0.92,
    flowBias: "neutral",
    events: [{ code: "CLAIM", label: "Jobless claims", impact: "medium", minutesUntil: 180 }],
    ...overrides,
  };
}

export function demoNewsBlackoutSentiment(): SentimentSnapshot {
  return demoSentiment({
    headlineScore: -0.2,
    headlines: ["FOMC decision due within the hour — vol desks on pause"],
    putCallRatio: 1.18,
    flowBias: "bearish",
    events: [{ code: "FOMC", label: "FOMC rate decision", impact: "high", minutesUntil: 45 }],
  });
}

export function attachSentiment(
  market: MarketSnapshot,
  sentiment: SentimentSnapshot
): MarketSnapshot {
  return { ...market, sentiment };
}

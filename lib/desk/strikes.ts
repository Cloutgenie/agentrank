import { SETTINGS } from "./brand";
import type {
  Leg,
  MarketSnapshot,
  OptionQuote,
  StructurePlan,
  TradeStructure,
} from "./types";

const MULTIPLIER = 100;

export function buildStructure(
  m: MarketSnapshot,
  plan: StructurePlan,
  opts?: { shortDelta?: number; widthPoints?: number; budgetMaxLoss?: number }
): TradeStructure | null {
  if (plan.kind === "no_trade") return null;

  const shortDeltaTarget = opts?.shortDelta ?? SETTINGS.shortDelta;
  const defaultWidth = opts?.widthPoints ?? defaultWidthFor(m.underlying);
  const chain = m.chain.length ? m.chain : synthesizeChain(m);
  const budget = opts?.budgetMaxLoss;

  if (plan.kind === "bull_put_vertical") {
    return buildVertical(m, chain, "P", "bull_put_vertical", shortDeltaTarget, defaultWidth, budget);
  }
  if (plan.kind === "bear_call_vertical") {
    return buildVertical(m, chain, "C", "bear_call_vertical", shortDeltaTarget, defaultWidth, budget);
  }
  return buildIronCondor(m, chain, shortDeltaTarget, defaultWidth, budget);
}

function buildVertical(
  m: MarketSnapshot,
  chain: OptionQuote[],
  right: "C" | "P",
  kind: "bull_put_vertical" | "bear_call_vertical",
  shortDeltaTarget: number,
  width: number,
  budgetMaxLoss?: number
): TradeStructure | null {
  const side = chain.filter((q) => q.right === right && q.dte === 0);
  const short = pickByDelta(side, right === "P" ? -shortDeltaTarget : shortDeltaTarget, m);
  if (!short) return null;

  const wingStrike = right === "P" ? short.strike - width : short.strike + width;
  let long =
    findStrike(side, wingStrike, { excludeStrike: short.strike, minDistance: 1 }) ??
    synthesizeWing(short, wingStrike);
  // Keep a real credit edge on tight widths (common for small starting bankrolls).
  if (long.ask >= short.bid * 0.9) {
    long = synthesizeWing(short, long.strike);
  }

  let legs = toCreditLegs(short, long);
  let credit = netCredit(legs);
  let usedWidth = Math.abs(short.strike - long.strike);

  if (budgetMaxLoss && budgetMaxLoss > 0) {
    for (let i = 0; i < 5; i++) {
      const maxLoss = Math.max(0, (usedWidth - credit) * MULTIPLIER);
      const minWidth = minWidthFor(m.underlying);
      if (maxLoss <= budgetMaxLoss || usedWidth <= minWidth) break;
      const targetWidth = Math.max(minWidth, Math.floor(budgetMaxLoss / MULTIPLIER + credit));
      if (targetWidth >= usedWidth) break;
      const cappedWing = right === "P" ? short.strike - targetWidth : short.strike + targetWidth;
      long =
        findStrike(side, cappedWing, { excludeStrike: short.strike, minDistance: 1 }) ??
        synthesizeWing(short, cappedWing);
      legs = toCreditLegs(short, long);
      credit = netCredit(legs);
      usedWidth = Math.abs(short.strike - long.strike);
    }
  }

  return {
    kind,
    legs,
    credit: round2(credit),
    width: usedWidth,
    maxLossPerContract: round2(Math.max(0, (usedWidth - credit) * MULTIPLIER)),
    shortDelta: Math.abs(short.delta),
    distanceFromVwap: round2(Math.abs(short.strike - m.vwap)),
  };
}

function buildIronCondor(
  m: MarketSnapshot,
  chain: OptionQuote[],
  shortDeltaTarget: number,
  width: number,
  budgetMaxLoss?: number
): TradeStructure | null {
  const puts = chain.filter((q) => q.right === "P" && q.dte === 0);
  const calls = chain.filter((q) => q.right === "C" && q.dte === 0);
  const shortPut = pickByDelta(puts, -shortDeltaTarget, m);
  const shortCall = pickByDelta(calls, shortDeltaTarget, m);
  if (!shortPut || !shortCall) return null;

  let longPut =
    findStrike(puts, shortPut.strike - width, { excludeStrike: shortPut.strike, minDistance: 1 }) ??
    synthesizeWing(shortPut, shortPut.strike - width);
  let longCall =
    findStrike(calls, shortCall.strike + width, {
      excludeStrike: shortCall.strike,
      minDistance: 1,
    }) ?? synthesizeWing(shortCall, shortCall.strike + width);

  const legs = [...toCreditLegs(shortPut, longPut), ...toCreditLegs(shortCall, longCall)];
  let credit = netCredit(legs);
  let usedWidth = Math.max(
    Math.abs(shortPut.strike - longPut.strike),
    Math.abs(shortCall.strike - longCall.strike)
  );

  if (budgetMaxLoss && budgetMaxLoss > 0) {
    for (let i = 0; i < 5; i++) {
      const maxLoss = Math.max(0, (usedWidth - credit) * MULTIPLIER);
      const minWidth = minWidthFor(m.underlying);
      if (maxLoss <= budgetMaxLoss || usedWidth <= minWidth) break;
      const targetWidth = Math.max(minWidth, Math.floor(budgetMaxLoss / MULTIPLIER + credit));
      if (targetWidth >= usedWidth) break;
      longPut =
        findStrike(puts, shortPut.strike - targetWidth, {
          excludeStrike: shortPut.strike,
          minDistance: 1,
        }) ?? synthesizeWing(shortPut, shortPut.strike - targetWidth);
      longCall =
        findStrike(calls, shortCall.strike + targetWidth, {
          excludeStrike: shortCall.strike,
          minDistance: 1,
        }) ?? synthesizeWing(shortCall, shortCall.strike + targetWidth);
      const rebuilt = [
        ...toCreditLegs(shortPut, longPut),
        ...toCreditLegs(shortCall, longCall),
      ];
      legs.splice(0, legs.length, ...rebuilt);
      credit = netCredit(legs);
      usedWidth = Math.max(
        Math.abs(shortPut.strike - longPut.strike),
        Math.abs(shortCall.strike - longCall.strike)
      );
    }
  }

  return {
    kind: "iron_condor",
    legs,
    credit: round2(credit),
    width: usedWidth,
    maxLossPerContract: round2(Math.max(0, (usedWidth - credit) * MULTIPLIER)),
    shortDelta: Math.max(Math.abs(shortPut.delta), Math.abs(shortCall.delta)),
    distanceFromVwap: round2(
      Math.min(Math.abs(shortPut.strike - m.vwap), Math.abs(shortCall.strike - m.vwap))
    ),
  };
}

function toCreditLegs(short: OptionQuote, long: OptionQuote): Leg[] {
  return [
    {
      right: short.right,
      strike: short.strike,
      side: "short",
      bid: short.bid,
      ask: short.ask,
      mid: short.mid,
      delta: short.delta,
    },
    {
      right: long.right,
      strike: long.strike,
      side: "long",
      bid: long.bid,
      ask: long.ask,
      mid: long.mid,
      delta: long.delta,
    },
  ];
}

function netCredit(legs: Leg[]): number {
  let credit = 0;
  for (const leg of legs) {
    if (leg.side === "short") credit += leg.bid;
    else credit -= leg.ask;
  }
  return Math.max(0.05, credit);
}

function pickByDelta(quotes: OptionQuote[], target: number, m: MarketSnapshot): OptionQuote | null {
  if (!quotes.length) return null;
  const otm = quotes.filter((q) =>
    q.right === "P" ? q.strike < m.underlying : q.strike > m.underlying
  );
  const pool = otm.length ? otm : quotes;
  const scored = pool.map((q) => {
    const deltaDist = Math.abs(Math.abs(q.delta) - Math.abs(target));
    const vwapDist = Math.abs(q.strike - m.vwap) / m.underlying;
    return { q, score: deltaDist + vwapDist * 0.25 };
  });
  scored.sort((a, b) => a.score - b.score);
  return scored[0]?.q ?? null;
}

function findStrike(
  quotes: OptionQuote[],
  strike: number,
  opts?: { excludeStrike?: number; minDistance?: number }
): OptionQuote | null {
  const exact = quotes.find((q) => q.strike === strike);
  if (exact && exact.strike !== opts?.excludeStrike) return exact;
  let best: OptionQuote | null = null;
  let bestDist = Infinity;
  const minDist = opts?.minDistance ?? 0;
  for (const q of quotes) {
    if (opts?.excludeStrike !== undefined && q.strike === opts.excludeStrike) continue;
    const d = Math.abs(q.strike - strike);
    if (d < minDist) continue;
    if (d < bestDist) {
      best = q;
      bestDist = d;
    }
  }
  return best;
}

function synthesizeWing(short: OptionQuote, strike: number): OptionQuote {
  const width = Math.abs(short.strike - strike);
  // Wings must be clearly cheaper than the short so credit stays realistic on $1-wide spreads.
  const decay = Math.max(0.25, Math.exp(-width / Math.max(2, short.strike * 0.004)));
  const mid = Math.max(0.05, short.mid * decay * 0.55);
  return {
    strike,
    right: short.right,
    dte: 0,
    bid: round2(Math.max(0.01, mid * 0.75)),
    ask: round2(mid * 1.05),
    mid: round2(mid),
    delta: short.delta * 0.4,
  };
}

function defaultWidthFor(spot: number): number {
  // Tight wings so small starting bankrolls (e.g. $100) can still size 1 contract.
  if (spot > 4000) return 5;
  if (spot > 400) return 1;
  return 1;
}

function minWidthFor(spot: number): number {
  if (spot > 4000) return 5;
  return 1;
}

export function synthesizeChain(m: MarketSnapshot): OptionQuote[] {
  const step = m.underlying > 4000 ? 5 : m.underlying > 400 ? 1 : 0.5;
  const out: OptionQuote[] = [];
  for (let i = -60; i <= 60; i++) {
    const strike = roundTo(m.underlying + i * step, step);
    const moneyness = (strike - m.underlying) / m.underlying;
    const callDelta = clamp(0.5 - moneyness * 22, 0.01, 0.99);
    const putDelta = clamp(callDelta - 1, -0.99, -0.01);
    const callMid = Math.max(0.05, m.underlying * 0.0012 * Math.min(callDelta, 1 - callDelta) * 2);
    const putMid = Math.max(
      0.05,
      m.underlying * 0.0012 * Math.min(Math.abs(putDelta), 1 - Math.abs(putDelta)) * 2
    );
    out.push(makeQuote(strike, "C", callMid, callDelta));
    out.push(makeQuote(strike, "P", putMid, putDelta));
  }
  return out;
}

function makeQuote(strike: number, right: "C" | "P", mid: number, delta: number): OptionQuote {
  const spread = Math.max(0.05, mid * 0.08);
  return {
    strike,
    right,
    dte: 0,
    bid: round2(Math.max(0.01, mid - spread / 2)),
    ask: round2(mid + spread / 2),
    mid: round2(mid),
    delta: round2(delta),
  };
}

function roundTo(n: number, step: number): number {
  return Math.round(n / step) * step;
}
function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

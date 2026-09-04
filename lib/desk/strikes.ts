import type { Leg, MarketSnapshot, OptionQuote, StructureKind, StructurePlan, TradeStructure } from "./types";

const MULTIPLIER = 100;

/**
 * Strikes from the view, not the chain.
 * Pick the short leg by delta or distance from VWAP,
 * then place the long wing to cap the loss you already budgeted.
 */
export function buildStructure(
  m: MarketSnapshot,
  plan: StructurePlan,
  opts?: { shortDelta?: number; widthPoints?: number; budgetMaxLoss?: number }
): TradeStructure | null {
  if (plan.kind === "no_trade") return null;

  const shortDeltaTarget = opts?.shortDelta ?? 0.16;
  const defaultWidth = opts?.widthPoints ?? defaultWidthForUnderlying(m.underlying);
  const chain = m.chain.length ? m.chain : synthesizeChain(m);

  if (plan.kind === "bull_put_vertical") {
    return buildVertical(m, chain, "P", "bull_put_vertical", shortDeltaTarget, defaultWidth, opts?.budgetMaxLoss);
  }
  if (plan.kind === "bear_call_vertical") {
    return buildVertical(m, chain, "C", "bear_call_vertical", shortDeltaTarget, defaultWidth, opts?.budgetMaxLoss);
  }
  return buildIronCondor(m, chain, shortDeltaTarget, defaultWidth, opts?.budgetMaxLoss);
}

function buildVertical(
  m: MarketSnapshot,
  chain: OptionQuote[],
  right: "C" | "P",
  kind: Exclude<StructureKind, "no_trade" | "iron_condor">,
  shortDeltaTarget: number,
  width: number,
  budgetMaxLoss?: number
): TradeStructure | null {
  const shorts = chain.filter((q) => q.right === right && q.dte === 0);
  const short = pickByDelta(shorts, shortDeltaTarget, m);
  if (!short) return null;

  const wingStrike =
    right === "P" ? short.strike - width : short.strike + width;
  const long =
    findStrike(shorts, wingStrike, { excludeStrike: short.strike, minDistance: 1 }) ??
    synthesizeWing(short, wingStrike);

  // Cap width to budgeted max loss if provided: maxLoss = (width - credit) * 100
  // We refine width after seeing credit.
  let legs = toCreditVerticalLegs(short, long);
  let credit = netCredit(legs);
  let usedWidth = Math.abs(short.strike - long.strike);

  if (budgetMaxLoss && budgetMaxLoss > 0) {
    // Ensure (width - credit) * 100 <= budget → width <= budget/100 + credit
    const maxWidth = budgetMaxLoss / MULTIPLIER + credit;
    if (usedWidth > maxWidth && maxWidth >= 5) {
      const cappedWing =
        right === "P" ? short.strike - Math.floor(maxWidth) : short.strike + Math.floor(maxWidth);
      const cappedLong =
        findStrike(shorts, cappedWing, { excludeStrike: short.strike, minDistance: 1 }) ??
        synthesizeWing(short, cappedWing);
      legs = toCreditVerticalLegs(short, cappedLong);
      credit = netCredit(legs);
      usedWidth = Math.abs(short.strike - cappedLong.strike);
    }
  }

  const maxLossPerContract = Math.max(0, (usedWidth - credit) * MULTIPLIER);
  const distanceFromVwap = Math.abs(short.strike - m.vwap);

  return {
    kind,
    legs,
    credit: round2(credit),
    width: usedWidth,
    maxLossPerContract: round2(maxLossPerContract),
    shortDelta: short.delta,
    distanceFromVwap: round2(distanceFromVwap),
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
  const shortPut = pickByDelta(puts, -shortDeltaTarget, m); // put delta negative
  const shortCall = pickByDelta(calls, shortDeltaTarget, m);
  if (!shortPut || !shortCall) return null;

  const longPut =
    findStrike(puts, shortPut.strike - width, {
      excludeStrike: shortPut.strike,
      minDistance: 1,
    }) ?? synthesizeWing(shortPut, shortPut.strike - width);
  const longCall =
    findStrike(calls, shortCall.strike + width, {
      excludeStrike: shortCall.strike,
      minDistance: 1,
    }) ?? synthesizeWing(shortCall, shortCall.strike + width);

  const putLegs = toCreditVerticalLegs(shortPut, longPut);
  const callLegs = toCreditVerticalLegs(shortCall, longCall);
  const legs = [...putLegs, ...callLegs];
  let credit = netCredit(legs);
  let usedWidth = Math.max(
    Math.abs(shortPut.strike - longPut.strike),
    Math.abs(shortCall.strike - longCall.strike)
  );

  // Iron condor max loss is one side: (width - credit) * 100
  if (budgetMaxLoss && budgetMaxLoss > 0) {
    // Solve for width such that (width - credit) * 100 <= budget
    // Recompute after wing adjust since credit changes with width.
    for (let guard = 0; guard < 5; guard++) {
      const maxLoss = Math.max(0, (usedWidth - credit) * MULTIPLIER);
      if (maxLoss <= budgetMaxLoss || usedWidth <= 5) break;
      const targetWidth = Math.max(5, Math.floor(budgetMaxLoss / MULTIPLIER + credit));
      if (targetWidth >= usedWidth) break;
      const lp =
        findStrike(puts, shortPut.strike - targetWidth, {
          excludeStrike: shortPut.strike,
          minDistance: 1,
        }) ?? synthesizeWing(shortPut, shortPut.strike - targetWidth);
      const lc =
        findStrike(calls, shortCall.strike + targetWidth, {
          excludeStrike: shortCall.strike,
          minDistance: 1,
        }) ?? synthesizeWing(shortCall, shortCall.strike + targetWidth);
      const rebuilt = [...toCreditVerticalLegs(shortPut, lp), ...toCreditVerticalLegs(shortCall, lc)];
      legs.splice(0, legs.length, ...rebuilt);
      credit = netCredit(legs);
      usedWidth = Math.max(
        Math.abs(shortPut.strike - lp.strike),
        Math.abs(shortCall.strike - lc.strike)
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

function toCreditVerticalLegs(short: OptionQuote, long: OptionQuote): Leg[] {
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

/** Credit vertical: sell short mid, buy long mid. Use conservative fill: short at bid, long at ask. */
function netCredit(legs: Leg[]): number {
  let credit = 0;
  for (const leg of legs) {
    if (leg.side === "short") credit += leg.bid; // sell at bid
    else credit -= leg.ask; // buy wing at ask
  }
  return Math.max(0.05, credit);
}

function pickByDelta(quotes: OptionQuote[], target: number, m: MarketSnapshot): OptionQuote | null {
  if (!quotes.length) return null;
  const wantPut = target < 0 || quotes[0]?.right === "P";
  const scored = quotes
    .filter((q) => {
      // Keep shorts OTM relative to spot
      if (q.right === "P") return q.strike < m.underlying;
      return q.strike > m.underlying;
    })
    .map((q) => {
      const deltaDist = Math.abs(Math.abs(q.delta) - Math.abs(target));
      const vwapDist = Math.abs(q.strike - m.vwap) / m.underlying;
      return { q, score: deltaDist + vwapDist * 0.25 };
    });
  const pool = scored.length ? scored : quotes.map((q) => ({
    q,
    score: Math.abs(Math.abs(q.delta) - Math.abs(target)),
  }));
  pool.sort((a, b) => a.score - b.score);
  void wantPut;
  return pool[0]?.q ?? null;
}

function findStrike(
  quotes: OptionQuote[],
  strike: number,
  opts?: { excludeStrike?: number; minDistance?: number }
): OptionQuote | null {
  const exact = quotes.find((q) => q.strike === strike);
  if (exact && exact.strike !== opts?.excludeStrike) return exact;
  // nearest distinct wing
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
  // Wings decay vs short — keep ask clearly below short bid so credit stays positive
  const mid = Math.max(0.05, short.mid * Math.max(0.15, Math.exp(-width / Math.max(8, short.strike * 0.008))));
  return {
    strike,
    right: short.right,
    dte: 0,
    bid: round2(Math.max(0.01, mid * 0.8)),
    ask: round2(mid * 1.1),
    mid: round2(mid),
    delta: short.right === "P" ? short.delta * 0.45 : short.delta * 0.45,
  };
}

function defaultWidthForUnderlying(spot: number): number {
  if (spot > 4000) return 10; // SPX — tighter wings keep 0DTE max-loss in retail risk budgets
  if (spot > 400) return 2; // SPY / IWM-ish
  return 1;
}

/** Demo/synthetic chain when live quotes aren't wired. */
export function synthesizeChain(m: MarketSnapshot): OptionQuote[] {
  const step = m.underlying > 4000 ? 5 : m.underlying > 400 ? 1 : 0.5;
  const out: OptionQuote[] = [];
  // Wide enough for 0.16Δ shorts + 25–50pt wings on SPX
  for (let i = -60; i <= 60; i++) {
    const strike = roundTo(m.underlying + i * step, step);
    const moneyness = (strike - m.underlying) / m.underlying;
    const callDelta = clamp(0.5 - moneyness * 22, 0.01, 0.99);
    // Put delta ≈ call delta − 1 (so 0.16Δ OTM puts sit below spot)
    const putDelta = clamp(callDelta - 1, -0.99, -0.01);
    // Premium peaks near ATM and decays with OTM |delta|
    const callMid = Math.max(0.05, m.underlying * 0.0012 * Math.min(callDelta, 1 - callDelta) * 2);
    const putMid = Math.max(
      0.05,
      m.underlying * 0.0012 * Math.min(Math.abs(putDelta), 1 - Math.abs(putDelta)) * 2
    );
    out.push(quote(strike, "C", callMid, callDelta));
    out.push(quote(strike, "P", putMid, putDelta));
  }
  return out;
}

function quote(strike: number, right: "C" | "P", mid: number, delta: number): OptionQuote {
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

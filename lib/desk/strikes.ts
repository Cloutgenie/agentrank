import { SETTINGS } from "./brand";
import type {
  Leg,
  MarketSnapshot,
  OptionQuote,
  StructurePlan,
  TradeStructure,
} from "./types";

const MULTIPLIER = 100;

/** Build a single-leg long Call or Put that fits the risk budget. */
export function buildStructure(
  m: MarketSnapshot,
  plan: StructurePlan,
  opts?: { shortDelta?: number; widthPoints?: number; budgetMaxLoss?: number }
): TradeStructure | null {
  if (plan.kind === "no_trade") return null;

  const right: "C" | "P" = plan.kind === "call" ? "C" : "P";
  const sideLabel = plan.kind === "call" ? ("Call" as const) : ("Put" as const);
  const deltaTarget = opts?.shortDelta ?? SETTINGS.targetDelta;
  const chain = m.chain.length ? m.chain : synthesizeChain(m);
  const budget = opts?.budgetMaxLoss;

  const quotes = chain.filter((q) => q.right === right && q.dte === 0);
  const picked = pickAffordable(quotes, right, deltaTarget, m, budget);
  if (!picked) return null;

  const debit = round2(picked.ask);
  const leg: Leg = {
    right: picked.right,
    strike: picked.strike,
    side: "long",
    bid: picked.bid,
    ask: picked.ask,
    mid: picked.mid,
    delta: picked.delta,
  };

  return {
    kind: plan.kind,
    side: sideLabel,
    legs: [leg],
    debit,
    credit: debit,
    width: 0,
    maxLossPerContract: round2(debit * MULTIPLIER),
    shortDelta: Math.abs(picked.delta),
    distanceFromVwap: round2(Math.abs(picked.strike - m.vwap)),
  };
}

function pickAffordable(
  quotes: OptionQuote[],
  right: "C" | "P",
  deltaTarget: number,
  m: MarketSnapshot,
  budgetMaxLoss?: number
): OptionQuote | null {
  if (!quotes.length) return null;

  const MIN_ASK = 0.2;
  const liquid = quotes.filter((q) => {
    if (!(q.ask >= MIN_ASK)) return false;
    if (q.bid <= 0) return false;
    const mid = q.mid > 0 ? q.mid : (q.bid + q.ask) / 2;
    const spread = q.ask - q.bid;
    // Reject absurdly wide pennies / ghost quotes.
    if (spread > Math.max(0.5, mid * 0.5)) return false;
    return true;
  });
  if (!liquid.length) return null;

  const otm = liquid.filter((q) =>
    right === "P" ? q.strike < m.underlying : q.strike > m.underlying
  );
  const pool = (otm.length ? otm : liquid).slice().sort((a, b) => {
    const da = Math.abs(Math.abs(a.delta) - deltaTarget);
    const db = Math.abs(Math.abs(b.delta) - deltaTarget);
    return da - db;
  });

  if (budgetMaxLoss && budgetMaxLoss > 0) {
    const maxDebit = budgetMaxLoss / MULTIPLIER;
    // Prefer delta-target among liquid names that fit the bankroll — not the cheapest junk.
    const fit = pool.filter((q) => q.ask <= maxDebit);
    return fit[0] ?? null;
  }

  return pool[0] ?? null;
}

export function synthesizeChain(m: MarketSnapshot): OptionQuote[] {
  const step = m.underlying > 4000 ? 5 : m.underlying > 400 ? 1 : 0.5;
  const out: OptionQuote[] = [];
  for (let i = -60; i <= 60; i++) {
    const strike = roundTo(m.underlying + i * step, step);
    const moneyness = (strike - m.underlying) / m.underlying;
    const callDelta = clamp(0.5 - moneyness * 22, 0.01, 0.99);
    const putDelta = clamp(callDelta - 1, -0.99, -0.01);
    const scale = m.underlying > 4000 ? 0.00035 : 0.0009;
    const callMid = Math.max(0.05, m.underlying * scale * Math.min(callDelta, 1 - callDelta) * 2);
    const putMid = Math.max(
      0.05,
      m.underlying * scale * Math.min(Math.abs(putDelta), 1 - Math.abs(putDelta)) * 2
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

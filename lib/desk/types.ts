/** 0DTE Desk — rules-engine types. Not a prediction model. */

export type Regime = "trend" | "range" | "vol_expansion" | "refuse";

export type StructureKind = "bull_put_vertical" | "bear_call_vertical" | "iron_condor" | "no_trade";

export type GexSign = "positive" | "negative" | "neutral";

export interface MarketSnapshot {
  symbol: string;
  underlying: number;
  vwap: number;
  vix: number;
  /** Net gamma exposure in notional units (sign matters more than magnitude). */
  gex: number;
  gexSign: GexSign;
  /** Opening range high / low (first 15–30m). */
  orHigh: number;
  orLow: number;
  /** Session progress 0–1 (0 = open, 1 = close). */
  sessionProgress: number;
  /** Wall-clock session time label, e.g. "10:42 ET". */
  asOf: string;
  /** Optional quote chain for strike selection. */
  chain: OptionQuote[];
}

export interface OptionQuote {
  strike: number;
  right: "C" | "P";
  /** Days to expiration — always 0 for this product. */
  dte: number;
  bid: number;
  ask: number;
  mid: number;
  delta: number;
}

export interface RiskLimits {
  accountEquity: number;
  /** Max risk per trade as fraction of equity (default 0.015). */
  riskPerTrade: number;
  /** Hard daily loss limit as fraction of equity (default 0.03). */
  dailyLossLimit: number;
  /** Realized + open P&L for the session (negative = loss). */
  dayPnl: number;
}

export interface RegimeResult {
  regime: Regime;
  reasons: string[];
  /** Size multiplier 0–1; refuse ⇒ 0. */
  sizeMultiplier: number;
  allowPremiumSale: boolean;
}

export interface StructurePlan {
  kind: StructureKind;
  bias: "bullish" | "bearish" | "neutral" | "none";
  reason: string;
}

export interface Leg {
  right: "C" | "P";
  strike: number;
  side: "short" | "long";
  bid: number;
  ask: number;
  mid: number;
  delta: number;
}

export interface TradeStructure {
  kind: Exclude<StructureKind, "no_trade">;
  legs: Leg[];
  /** Net credit received (positive) for premium sales. */
  credit: number;
  /** Width of the short vertical in points. */
  width: number;
  /** Max loss in dollars = (width - credit) * 100 * contracts — before contracts. */
  maxLossPerContract: number;
  shortDelta: number;
  distanceFromVwap: number;
}

export interface PositionSize {
  contracts: number;
  riskDollars: number;
  riskPct: number;
  blocked: boolean;
  blockReason?: string;
}

export interface ExitPlan {
  /** Take-profit credit remaining (buy-to-close target). */
  takeProfitPrice: number;
  /** Stop-loss debit / credit remaining. */
  stopLossPrice: number;
  /** Take profit as % of credit captured. */
  takeProfitPct: number;
  /** Stop as multiple of credit (e.g. 2×). */
  stopMultiple: number;
  /** Hard time exit before final gamma spike, ET clock. */
  timeExitEt: string;
  notes: string[];
}

/** The desk ticket — what the user actually sees. */
export interface DeskPlay {
  id: string;
  symbol: string;
  title: string;
  structure: TradeStructure;
  size: PositionSize;
  exits: ExitPlan;
  regime: RegimeResult;
  plan: StructurePlan;
  /** Simple ticket fields. */
  ticket: {
    action: "BUY" | "SELL_TO_OPEN";
    entry: number;
    takeProfit: number;
    stopLoss: number;
    exitBy: string;
    contracts: number;
    maxLoss: number;
    summary: string;
  };
  asOf: string;
  rank: number;
}

/** REDZONE — 0DTE rules-engine types. */

export type Regime = "trend" | "range" | "vol_expansion" | "refuse";
export type StructureKind =
  | "bull_put_vertical"
  | "bear_call_vertical"
  | "iron_condor"
  | "no_trade";
export type GexSign = "positive" | "negative" | "neutral";

export interface OptionQuote {
  strike: number;
  right: "C" | "P";
  dte: number;
  bid: number;
  ask: number;
  mid: number;
  delta: number;
}

export interface MarketSnapshot {
  symbol: string;
  underlying: number;
  vwap: number;
  vix: number;
  gex: number;
  gexSign: GexSign;
  orHigh: number;
  orLow: number;
  sessionProgress: number;
  asOf: string;
  chain: OptionQuote[];
  sentiment?: import("./sentiment").SentimentSnapshot;
}

export interface RiskLimits {
  accountEquity: number;
  riskPerTrade: number;
  dailyLossLimit: number;
  dayPnl: number;
}

export interface RegimeResult {
  regime: Regime;
  reasons: string[];
  sizeMultiplier: number;
  allowPremiumSale: boolean;
  sentimentNotes?: string[];
  newsBlackout?: boolean;
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
  credit: number;
  width: number;
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
  takeProfitPrice: number;
  stopLossPrice: number;
  takeProfitPct: number;
  stopMultiple: number;
  timeExitEt: string;
  notes: string[];
}

export interface DeskPlay {
  id: string;
  symbol: string;
  title: string;
  structure: TradeStructure;
  size: PositionSize;
  exits: ExitPlan;
  regime: RegimeResult;
  plan: StructurePlan;
  ticket: {
    action: "SELL_TO_OPEN";
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

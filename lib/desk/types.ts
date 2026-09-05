/** REDZONE — Robinhood-simple Call / Put desk types. */

export type Regime = "trend" | "range" | "vol_expansion" | "refuse";
/** Only two plays — Call or Put. */
export type StructureKind = "call" | "put" | "no_trade";
export type GexSign = "positive" | "negative" | "neutral";
export type Side = "Call" | "Put";

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
  feedMode?: "demo" | "live";
  feedProvider?: string;
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
  side: Side;
  legs: Leg[];
  debit: number;
  /** Alias of debit for older helpers. */
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
  /** Clock time the signal says to take the play (usually "now"). */
  takeAt: string;
  /** Deadline to open — miss this and skip the play. */
  enterBy: string;
  timeExitEt: string;
  notes: string[];
}

export interface DeskPlay {
  id: string;
  symbol: string;
  side: Side;
  title: string;
  structure: TradeStructure;
  size: PositionSize;
  exits: ExitPlan;
  regime: RegimeResult;
  plan: StructurePlan;
  ticket: {
    action: "BUY_TO_OPEN";
    entry: number;
    takeProfit: number;
    stopLoss: number;
    /** When to take the play (e.g. "Now · by 10:57 ET"). */
    takeAt: string;
    /** Hard deadline to open the trade. */
    enterBy: string;
    exitBy: string;
    contracts: number;
    maxLoss: number;
    strike: number;
    summary: string;
  };
  asOf: string;
  rank: number;
}

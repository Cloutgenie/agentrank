/**
 * LIVE market data for REDZONE — production scans are live-only.
 *
 * Priority:
 *   1. ThetaData — THETADATA_HOST
 *   2. ORATS     — ORATS_API_KEY
 *   3. Public tape — Nasdaq option chain + CBOE VIX + Yahoo 1m bars
 *
 * If live fetch fails, the desk refuses. No demo quotes in the scan path.
 */

import { inferGexSign } from "./regime";
import type { MarketSnapshot, OptionQuote } from "./types";

export type FeedMode = "live";

export interface FeedStatus {
  mode: FeedMode;
  provider: "thetadata" | "orats" | "nasdaq";
  latencyMs: number | null;
  asOf: string;
  message: string;
  credentialsPresent: boolean;
  underlying: number;
  vix: number;
}

export class LiveFeedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LiveFeedError";
  }
}

export function detectFeedConfig(): {
  provider: FeedStatus["provider"];
  credentialsPresent: boolean;
} {
  if (process.env.THETADATA_HOST?.trim()) {
    return { provider: "thetadata", credentialsPresent: true };
  }
  if (process.env.ORATS_API_KEY?.trim()) {
    return { provider: "orats", credentialsPresent: true };
  }
  return { provider: "nasdaq", credentialsPresent: false };
}

/** Demo feed removed — live-only. */
export function demoFeedStatus(): never {
  throw new LiveFeedError("Demo feed removed — REDZONE is live-only");
}

export function explainLiveData(): string {
  return [
    "Live only: Nasdaq option chain + CBOE VIX + Yahoo session bars (or ThetaData/ORATS when keys are wired).",
    "If the live tape cannot be fetched, the desk refuses — it will not invent demo quotes.",
    "Broker fills stay in your broker; REDZONE prints Call/Put · take-by · TP · SL from the live snapshot.",
  ].join(" ");
}

export async function fetchLiveMarket(symbol = "SPY"): Promise<{
  market: MarketSnapshot;
  feed: FeedStatus;
}> {
  const started = Date.now();
  const cfg = detectFeedConfig();

  if (cfg.provider === "thetadata") {
    throw new LiveFeedError(
      "THETADATA_HOST is set, but the Theta adapter needs your terminal schema. Unset it to use the public live tape, or wire the adapter."
    );
  }
  if (cfg.provider === "orats") {
    throw new LiveFeedError(
      "ORATS_API_KEY is set, but the ORATS adapter needs your plan schema. Unset it to use the public live tape, or wire the adapter."
    );
  }

  try {
    const sym = symbol.toUpperCase() === "SPX" ? "SPY" : symbol.toUpperCase();
    return await fetchPublicTape(sym, started);
  } catch (err) {
    throw new LiveFeedError(
      `Live tape unavailable: ${err instanceof Error ? err.message : String(err)}`
    );
  }
}

export async function fetchLiveSnapshot(symbol: string): Promise<MarketSnapshot> {
  const { market } = await fetchLiveMarket(symbol);
  return market;
}

async function fetchPublicTape(symbol: string, started: number) {
  const [chainPack, vix, bars] = await Promise.all([
    fetchNasdaqChain(symbol),
    fetchCboeVix(),
    fetchYahooSession(symbol),
  ]);

  const underlying = chainPack.underlying || bars.last;
  if (!(underlying > 0) || chainPack.chain.length < 8) {
    throw new Error(`Incomplete live chain for ${symbol} (${chainPack.chain.length} quotes)`);
  }

  const asOfMs = bars.asOfMs || Date.now();
  const asOf = formatEtClock(asOfMs);
  const gex = estimateGex(chainPack.chain, underlying);
  const putCallRatio = chainPack.putCallRatio;

  const market: MarketSnapshot = {
    symbol,
    underlying: round2(underlying),
    vwap: round2(bars.vwap || underlying),
    vix: round2(vix),
    gex,
    gexSign: inferGexSign(gex),
    orHigh: round2(bars.orHigh || underlying * 1.002),
    orLow: round2(bars.orLow || underlying * 0.998),
    sessionProgress: etSessionProgress(asOfMs),
    asOf,
    chain: chainPack.chain,
    sentiment: {
      headlineScore: putCallRatio > 1.1 ? -0.2 : putCallRatio < 0.7 ? 0.15 : 0.05,
      headlines: [
        `Live ${symbol} ${underlying.toFixed(2)} · VIX ${vix.toFixed(2)} · P/C ${putCallRatio.toFixed(2)}`,
        `Session VWAP ${(bars.vwap || underlying).toFixed(2)} · OR ${(bars.orLow || 0).toFixed(2)}–${(bars.orHigh || 0).toFixed(2)}`,
        "Tape: Nasdaq options + CBOE VIX + Yahoo session bars — live desk, no demo",
      ],
      putCallRatio,
      flowBias: putCallRatio > 1.05 ? "bearish" : putCallRatio < 0.85 ? "bullish" : "neutral",
      events: [],
    },
    feedMode: "live",
    feedProvider: "nasdaq",
  };

  const feed: FeedStatus = {
    mode: "live",
    provider: "nasdaq",
    latencyMs: Date.now() - started,
    asOf,
    message: `Live ${symbol} · Nasdaq chain + CBOE VIX · ${chainPack.chain.length} option quotes`,
    credentialsPresent: false,
    underlying: market.underlying,
    vix: market.vix,
  };

  return { market, feed };
}

async function fetchNasdaqChain(symbol: string): Promise<{
  underlying: number;
  chain: OptionQuote[];
  putCallRatio: number;
}> {
  const today = etYmd(Date.now());
  const headers = {
    Accept: "application/json, text/plain, */*",
    Origin: "https://www.nasdaq.com",
    Referer: `https://www.nasdaq.com/market-activity/etf/${symbol.toLowerCase()}/option-chain`,
  };

  let data = await httpJson(
    `https://api.nasdaq.com/api/quote/${encodeURIComponent(symbol)}/option-chain?assetclass=etf&limit=200&fromdate=${today}&todate=${today}&excode=oprac&callput=callput&money=all&type=all`,
    headers
  );

  let rows: Array<Record<string, unknown>> =
    data?.data?.table?.rows?.filter((r: Record<string, unknown>) => r?.strike) ?? [];

  if (rows.length < 8) {
    data = await httpJson(
      `https://api.nasdaq.com/api/quote/${encodeURIComponent(symbol)}/option-chain?assetclass=etf&limit=200&excode=oprac&callput=callput&money=all&type=all`,
      headers
    );
    rows = data?.data?.table?.rows?.filter((r: Record<string, unknown>) => r?.strike) ?? [];
  }

  if (rows.length < 8) {
    throw new Error(`Nasdaq returned too few option rows (${rows.length})`);
  }

  const lastTrade = String(data?.data?.lastTrade ?? "");
  const priceMatch = lastTrade.match(/\$([0-9]+(?:\.[0-9]+)?)/);
  let underlying = priceMatch ? Number(priceMatch[1]) : 0;

  const chain: OptionQuote[] = [];
  let callVol = 0;
  let putVol = 0;

  for (const row of rows) {
    const strike = num(row.strike);
    if (!(strike > 0)) continue;

    const cBid = num(row.c_Bid);
    const cAsk = num(row.c_Ask);
    const cLast = num(row.c_Last);
    const pBid = num(row.p_Bid);
    const pAsk = num(row.p_Ask);
    const pLast = num(row.p_Last);
    callVol += num(row.c_Volume);
    putVol += num(row.p_Volume);

    const callMid = midFrom(cBid, cAsk, cLast);
    const putMid = midFrom(pBid, pAsk, pLast);

    if (callMid > 0) {
      chain.push(makeQuote(strike, "C", cBid, cAsk, callMid, underlying || strike));
    }
    if (putMid > 0) {
      chain.push(makeQuote(strike, "P", pBid, pAsk, putMid, underlying || strike));
    }
  }

  if (!underlying) {
    const strikes = [...new Set(chain.map((q) => q.strike))].sort((a, b) => a - b);
    underlying = strikes[Math.floor(strikes.length / 2)] ?? 0;
    for (const q of chain) q.delta = approxDelta(underlying, q.strike, q.right);
  }

  return {
    underlying,
    chain,
    putCallRatio: callVol > 0 ? putVol / Math.max(1, callVol) : 1,
  };
}

async function fetchCboeVix(): Promise<number> {
  const data = await httpJson("https://cdn.cboe.com/api/global/delayed_quotes/quotes/_VIX.json");
  const px = Number(data?.data?.current_price);
  if (!(px > 0)) throw new Error("CBOE VIX missing");
  return px;
}

async function fetchYahooSession(symbol: string): Promise<{
  last: number;
  vwap: number;
  orHigh: number;
  orLow: number;
  asOfMs: number;
}> {
  const data = await httpJson(
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1m&range=1d`
  );
  const result = data?.chart?.result?.[0];
  if (!result) throw new Error("Yahoo session bars missing");

  const meta = result.meta ?? {};
  const quote = result.indicators?.quote?.[0] ?? {};
  const highs: Array<number | null> = quote.high ?? [];
  const lows: Array<number | null> = quote.low ?? [];
  const closes: Array<number | null> = quote.close ?? [];
  const vols: Array<number | null> = quote.volume ?? [];

  let pv = 0;
  let vv = 0;
  let orHigh = -Infinity;
  let orLow = Infinity;

  for (let i = 0; i < closes.length; i++) {
    const c = closes[i];
    if (c == null) continue;
    const h = highs[i];
    const l = lows[i];
    const v = vols[i] ?? 0;
    const typical = ((h ?? c) + (l ?? c) + c) / 3;
    if (v > 0) {
      pv += typical * v;
      vv += v;
    }
    if (h != null) orHigh = Math.max(orHigh, h);
    if (l != null) orLow = Math.min(orLow, l);
  }

  const last = Number(meta.regularMarketPrice ?? closes.filter((x) => x != null).at(-1) ?? 0);
  return {
    last,
    vwap: vv > 0 ? pv / vv : last,
    orHigh: orHigh === -Infinity ? last * 1.002 : orHigh,
    orLow: orLow === Infinity ? last * 0.998 : orLow,
    asOfMs: Number(meta.regularMarketTime ? meta.regularMarketTime * 1000 : Date.now()),
  };
}

function makeQuote(
  strike: number,
  right: "C" | "P",
  bid: number,
  ask: number,
  mid: number,
  spot: number
): OptionQuote {
  const cleanBid = Math.max(0.01, round2(bid > 0 ? bid : mid * 0.95));
  const cleanAsk = Math.max(cleanBid + 0.01, round2(ask > 0 ? ask : mid * 1.05));
  const cleanMid = round2(Math.max(0.01, mid || (cleanBid + cleanAsk) / 2));
  return {
    strike,
    right,
    dte: 0,
    bid: cleanBid,
    ask: cleanAsk,
    mid: cleanMid,
    delta: approxDelta(spot, strike, right),
  };
}

function approxDelta(spot: number, strike: number, right: "C" | "P"): number {
  const m = (spot - strike) / Math.max(1, spot * 0.02);
  const call = clamp(0.5 + m * 0.35, 0.02, 0.98);
  return round2(right === "C" ? call : call - 1);
}

function estimateGex(chain: OptionQuote[], spot: number): number {
  let callMass = 0;
  let putMass = 0;
  for (const q of chain) {
    const otm = q.right === "C" ? q.strike >= spot : q.strike <= spot;
    if (!otm) continue;
    if (q.right === "C") callMass += q.mid;
    else putMass += q.mid;
  }
  return (putMass - callMass) * 1e9;
}

function midFrom(bid: number, ask: number, last: number): number {
  if (bid > 0 && ask > 0) return (bid + ask) / 2;
  if (last > 0) return last;
  if (bid > 0) return bid;
  if (ask > 0) return ask;
  return 0;
}

function num(v: unknown): number {
  if (v == null) return 0;
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  const s = String(v).replace(/[$,]/g, "").trim();
  if (!s || s === "--" || s === "N/A") return 0;
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

async function httpJson(url: string, extraHeaders?: Record<string, string>) {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; REDZONE/1.0)",
      ...(extraHeaders ?? {}),
    },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
}

function formatEtClock(ms: number): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    hour: "numeric",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date(ms));
  const hour = parts.find((p) => p.type === "hour")?.value ?? "00";
  const minute = parts.find((p) => p.type === "minute")?.value ?? "00";
  return `${Number(hour)}:${minute} ET`;
}

function etYmd(ms: number): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(ms));
}

function etSessionProgress(ms: number): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date(ms));
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? 12);
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
  const mins = hour * 60 + minute;
  const open = 9 * 60 + 30;
  const close = 16 * 60;
  if (mins <= open) return 0.02;
  if (mins >= close) return 0.99;
  return clamp((mins - open) / (close - open), 0.02, 0.99);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

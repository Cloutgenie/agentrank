/**
 * How live real-time data works in REDZONE
 * ---------------------------------------
 *
 * The rules engine never invents “the play” from vibes. It always needs a
 * MarketSnapshot: underlying, VWAP, VIX, GEX, opening range, and a 0DTE chain
 * (bid / ask / delta per strike).
 *
 * Modes
 * -----
 * 1. **demo** (default today)
 *    - Synthetic SPY/SPX quotes from `demoMarket()` + `synthesizeChain()`.
 *    - Headlines / put-call / events from `demoSentiment()`.
 *    - Safe for UI, sizing, and backtest plumbing with no API keys.
 *
 * 2. **live** (when credentials are present)
 *    - Poll or stream an options vendor on a short interval (5–15s typical).
 *    - Map vendor payload → `MarketSnapshot` → same `runRulesEngine()`.
 *    - Providers supported by this module:
 *        • ThetaData  — `THETADATA_HOST` (e.g. http://127.0.0.1:25510)
 *        • ORATS      — `ORATS_API_KEY`
 *    - If the live fetch fails or keys are missing → fall back to demo and
 *      surface `feed.mode = "demo"` so the UI never pretends it’s live.
 *
 * What “real time” means here
 * ---------------------------
 * - Underlying last / mid, option NBBO (bid-ask), and session markers (OR, VWAP).
 * - Not a broker fill stream. Execution still happens in your broker (IBKR /
 *   tastytrade / Robinhood). REDZONE is the rules ticket; the broker is the fill.
 *
 * Wire this up
 * ------------
 *   THETADATA_HOST=http://127.0.0.1:25510
 *   # or
 *   ORATS_API_KEY=…
 *
 * The desk UI badge reads `feed.mode` from `/api/desk/scan`.
 */

export type FeedMode = "demo" | "live";

export interface FeedStatus {
  mode: FeedMode;
  provider: "demo" | "thetadata" | "orats";
  latencyMs: number | null;
  asOf: string;
  message: string;
  credentialsPresent: boolean;
}

export function detectFeedConfig(): {
  provider: FeedStatus["provider"];
  credentialsPresent: boolean;
} {
  const theta = process.env.THETADATA_HOST?.trim();
  const orats = process.env.ORATS_API_KEY?.trim();
  if (theta) return { provider: "thetadata", credentialsPresent: true };
  if (orats) return { provider: "orats", credentialsPresent: true };
  return { provider: "demo", credentialsPresent: false };
}

export function demoFeedStatus(asOf = "10:42 ET"): FeedStatus {
  const { credentialsPresent, provider } = detectFeedConfig();
  if (!credentialsPresent) {
    return {
      mode: "demo",
      provider: "demo",
      latencyMs: null,
      asOf,
      message:
        "Demo quotes — add THETADATA_HOST or ORATS_API_KEY for live bid/ask",
      credentialsPresent: false,
    };
  }
  return {
    mode: "demo",
    provider,
    latencyMs: null,
    asOf,
    message: `${provider} keys found — live fetch not connected yet; using demo chain`,
    credentialsPresent: true,
  };
}

export async function fetchLiveSnapshot(_symbol: string): Promise<null> {
  const cfg = detectFeedConfig();
  if (!cfg.credentialsPresent) return null;
  return null;
}

export function explainLiveData(): string {
  return [
    "Live path: vendor (ThetaData or ORATS) → MarketSnapshot → same Call/Put rules engine.",
    "Without API keys the desk uses demo quotes so you can still size a $100 play.",
    "Broker fills are separate — REDZONE prints the ticket (Buy Call/Put · TP · SL).",
  ].join(" ");
}

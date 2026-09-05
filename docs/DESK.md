# REDZONE

**0DTE rules desk** — Robinhood-simple: **Call** or **Put** only.

ESPN-style desk that scans the market and returns **one play**:

| | |
|---|---|
| **Side** | Call (bullish) or Put (bearish) |
| **When** | Take now — open within 15 minutes (no new entries after 13:30 ET) |
| **Entry** | Buy-to-open debit |
| **Take profit** | +50% of premium |
| **Stop loss** | −50% of premium |
| **Exit by** | Before the close (15:00 ET) |

## Brand

- **Name:** REDZONE — only the play that matters
- **Look:** ESPN-inspired — black header, red accent `#E31837`, scoreboard ticker

## How live real-time data works

The rules engine always needs a **MarketSnapshot**: underlying, VWAP, VIX, GEX, opening range, and a 0DTE chain (bid / ask / delta).

| Mode | What happens |
|---|---|
| **Demo** (default) | Synthetic SPY/SPX quotes + demo headlines. No API keys needed. |
| **Live** | ThetaData (`THETADATA_HOST`) or ORATS (`ORATS_API_KEY`) → same snapshot → same Call/Put engine. |

- Quote age shows as `asOf` / optional `latencyMs`.
- Broker fills stay in your broker — REDZONE prints the ticket only.
- UI badge reads `feed.mode` (`demo` | `live`) so it never pretends to be live.

Wire up:

```bash
THETADATA_HOST=http://127.0.0.1:25510
# or
ORATS_API_KEY=…
```

## Rules

1. **Regime + news** — VIX, opening range, GEX, headlines, put/call, FOMC/CPI/NFP blackouts
2. **Call or Put** — above VWAP / broke high → Call; below / broke low → Put
3. **Strike** — ~25Δ that fits starting money
4. **Size** — whole bankroll is the risk budget for the one play
5. **Exits** — +50% TP, −50% SL, flat by 15:00 ET

Negative GEX + hot VIX → refuse.

## Run

```bash
npm install
npm run test:desk
npm run dev
# http://localhost:3000/desk
# http://localhost:3000/desk/app
```

## Stack

| Layer | Choice |
|---|---|
| UI | Next.js `/desk` — ESPN broadcast layout |
| Engine | TypeScript `lib/desk` |
| Backtest | Python `python/desk_engine` on bid/ask |
| API | `GET/POST /api/desk/scan` (+ `wire` + `feed`) |

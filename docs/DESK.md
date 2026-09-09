# REDZONE

**0DTE rules desk** — not a prediction model.

ESPN-style desk that scans the market and returns **one play**:

| | |
|---|---|
| **Entry** | Sell-to-open credit |
| **Take profit** | 50% of credit |
| **Stop loss** | 2× credit |
| **Exit by** | Before the final gamma spike (15:00 ET) |

## Brand

- **Name:** REDZONE — only the play that matters (RedZone metaphor: scoring plays only)
- **Logo:** `/public/desk/redzone-mark.svg` (+ generated mark asset)
- **Look:** ESPN-inspired — black header, red accent `#E31837`, scoreboard ticker, box-score tickets

## Rules (calibrated)

Synthesized from SpotGamma / FlashAlpha / tasty-style 0DTE practice + prop risk:

1. **Regime + news** — VIX, opening range, GEX, headlines, put/call, FOMC/CPI/NFP blackouts
2. **Defined risk** — verticals / iron condors; max loss = `(width − credit) × 100`
3. **Strikes** — short ~16Δ / VWAP distance; long wing caps budgeted loss
4. **Size** — 1% of account per trade; hard daily 3% then stop
5. **Exits** — 50% TP, 2× credit SL, flat by 15:00 ET

Negative GEX + hot VIX → refuse premium sales.

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
| API | `GET/POST /api/desk/scan` (+ `wire` headlines) |

# Desk

**0DTE rules engine SaaS** — not a prediction model.

The desk scans the market with explicit conditions, picks defined-risk structure, and hands you **one ticket**:

| | |
|---|---|
| **Entry** | Sell-to-open credit |
| **Take profit** | 50% of credit |
| **Stop loss** | 2× credit |
| **Exit by** | Before the final gamma spike |

## Run

```bash
npm install
npm run dev
# open http://localhost:3000/desk
# desk app: http://localhost:3000/desk/app
```

```bash
npm run test:desk
python -m desk_engine.engine   # from python/ with PYTHONPATH=.
```

## Stack

| Layer | Choice |
|---|---|
| SaaS UI | Next.js App Router · `/desk` |
| Rules engine | TypeScript `lib/desk` |
| Backtest | Python `python/desk_engine` on **bid/ask** (ThetaData / ORATS) |
| Execution | Paper blotter now · IBKR / tastytrade adapters stubbed |
| Auth / billing | Same Clerk + Stripe shell as the host app (optional) |

## Rules (order)

1. **Regime** — VIX, opening range, GEX. Negative GEX + 0DTE gamma → cut size or refuse.
2. **Defined risk** — Verticals or iron condors. Max loss = `(width − credit) × 100`.
3. **Strikes** — Short by delta / VWAP distance; long wing caps budgeted loss.
4. **Size** — 1–2% of account; hard daily ≈3% then stop.
5. **Exits** — 50% TP, 2× credit SL, time stop.

## API

`GET/POST /api/desk/scan` → `{ primary, plays, risk }`

Demo mode synthesizes a quote chain when live feeds aren’t connected. Wire ThetaData/ORATS for backtests and IBKR/tastytrade for paper → live.

# Desk rules engine (`lib/desk`)

TypeScript rules engine that powers `/desk` and `POST /api/desk/scan`.

## Pipeline

1. **Regime** — VIX + opening range + GEX. Negative GEX + hot VIX refuses premium sales.
2. **Structure** — Defined risk only: bull put / bear call verticals or iron condors.
3. **Strikes** — Short leg by delta (≈0.16) or VWAP distance; long wing caps budgeted max loss.
4. **Size** — 1–2% of account per trade; hard daily loss ≈3%.
5. **Exits** — 50% profit target, 2× credit stop, time exit before the final gamma spike.

## UX contract

The desk returns **one ticket**: entry credit, take profit, stop loss, exit-by time, contracts, max loss.

## Python twin

`python/desk_engine` mirrors these rules for bid/ask backtests (ThetaData / ORATS — never OHLC fills).

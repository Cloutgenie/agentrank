# REDZONE engine (`lib/desk`)

TypeScript rules engine for `/desk` and `POST /api/desk/scan`.

## Pipeline

1. **Regime + news** — VIX, OR, GEX, headlines, put/call, event blackouts  
2. **Structure** — Call or Put only (long debit)  
3. **Strike** — ~25Δ that fits the bankroll  
4. **Size** — starting money is the risk budget  
5. **Exits** — +50% TP, −50% SL, flat by 15:00 ET  

## Live data

See `feed.ts`. Demo by default; set `THETADATA_HOST` or `ORATS_API_KEY` for live.

## Brand

**REDZONE** — only the play that matters.

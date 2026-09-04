# REDZONE engine (`lib/desk`)

TypeScript rules engine for `/desk` and `POST /api/desk/scan`.

## Pipeline

1. **Regime + news** — VIX, OR, GEX, headlines, put/call, event blackouts  
2. **Structure** — defined-risk verticals / iron condors only  
3. **Strikes** — short ~16Δ; wing caps budgeted max loss  
4. **Size** — 1% / trade, 3% daily hard stop  
5. **Exits** — 50% TP, 2× credit SL, flat by 15:00 ET  

## Brand

**REDZONE** — only the play that matters.

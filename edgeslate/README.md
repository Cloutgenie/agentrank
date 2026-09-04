# EdgeSlate

**Beat the board.** NBA edge finder + DFS lineup lab with an Underdog-inspired dark UI.

| | |
|---|---|
| **Brand** | EdgeSlate |
| **Mark** | Slate tile + lime slash (`frontend/public/logo.png`) |
| **Wordmark** | `Edge` in mist + `Slate` in lime |
| **Palette** | Void `#070707` · Lime `#C8FF00` · Mist `#E8E8E8` |
| **UI** | Higher/Lower toggles, pick cards, lime CTAs |


## Stack

| Layer | Choice |
|---|---|
| API | Python 3.12 · FastAPI · SQLAlchemy · APScheduler |
| DB | Postgres 16 |
| Optimizer | NumPy Monte Carlo · PuLP (CBC) |
| Frontend | Next.js 15 · React · Tailwind · Recharts |
| Local | Docker Compose |

## Project layout

```
edgeslate/
  docker-compose.yml
  .env.example
  backend/
    app/
      api/           # REST routes
      clients/       # Odds API, BallDontLie, PrizePicks, Underdog, Polymarket/Kalshi
      services/      # pipeline, game model, optimizer, backtest
      db/            # SQLAlchemy models + session
    requirements.txt
    tests/
  frontend/          # Next.js app (picks, lineups, backtest)
  scripts/
```

## Unofficial DFS endpoints (documented in clients)

**PrizePicks** (community / GitHub):

```
GET https://api.prizepicks.com/projections
  ?league_id=7&per_page=250&single_stat=true&game_mode=pickem
```

Referenced in `bryanrg22/Lambda-Rim` and StackOverflow (clayjones94). NBA `league_id=7`. Cloudflare may block datacenter IPs — demo props cover local/dev.

**Underdog Fantasy** (GitHub code search):

```
GET https://api.underdogfantasy.com/beta/v5/over_under_lines
GET https://api.underdogfantasy.com/beta/v6/over_under_lines
GET https://api.underdogfantasy.com/v1/over_under_lines
```

Seen in `JavierC24/BetMaker`, `linemaker-asup/esports-lines-dashboard`, `jaayslaughter-cpu/mework`. Client tries each URL in order.

**Prediction markets**

- Polymarket Gamma: `https://gamma-api.polymarket.com/events`
- Kalshi: `https://api.elections.kalshi.com/trade-api/v2/markets`
- Robinhood: deep-link search only (no stable public board API in v1)

## Model logic (MVP)

- **Game winners:** `0.70 × market-implied (de-vigged books + PM blend) + 0.30 × Elo/efficiency`
- **Edge gate:** surface only when model beats market by **≥ 2 percentage points**
- **Lineups:** simulate outcomes per prop, PuLP maximize surrogate EV, constraints: slate size, ≤3 from one team, one pick per player; emit top 5
- **Success metric:** positive EV over **500+** graded picks before user-facing launch (`/backtest`)

## Quick start (local)

### 1. Env

```bash
cd edgeslate
cp .env.example .env
# Optional: set ODDS_API_KEY and BALLDONTLIE_API_KEY
# USE_DEMO_DATA=true works with zero keys
```

### 2. Postgres + API via Compose

```bash
docker compose up -d db
```

Or run the full stack:

```bash
docker compose up --build
```

- API: http://localhost:8000/docs  
- Frontend: http://localhost:3000  

### 3. API without Docker (venv)

```bash
cd backend
python3.12 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Postgres must be up (compose db service or local)
export DATABASE_URL=postgresql+psycopg://edgeslate:edgeslate@localhost:5432/edgeslate
export USE_DEMO_DATA=true
uvicorn app.main:app --reload --port 8000
```

Seed / refresh:

```bash
curl -X POST http://localhost:8000/api/ingest/demo
curl -X POST http://localhost:8000/api/ingest/run
```

### 4. Frontend

```bash
cd frontend
npm install
export NEXT_PUBLIC_API_URL=http://localhost:8000
npm run dev
```

Open http://localhost:3000 → **Game Picker**, **Lineups**, **Backtest**.

### 5. Tests

```bash
cd backend && source .venv/bin/activate
pytest -q
```

## Cron / deploy

Set `ENABLE_SCHEDULER=true` to run the full ingest + predict job every 30 minutes via APScheduler inside the API process.

Deploy targets (MVP): Railway or Render — one Postgres service, one API web service, one frontend (or static/Node). Point `DATABASE_URL`, API keys, `CORS_ORIGINS`, and `NEXT_PUBLIC_API_URL` at your hosts.

## API map

| Method | Path | Purpose |
|---|---|---|
| GET | `/health` | Liveness + demo flag |
| GET | `/api/picks/games` | Ranked edged game picks |
| POST | `/api/lineups/optimize` | Run Monte Carlo + PuLP |
| GET | `/api/lineups?platform=` | Latest optimized slips |
| GET | `/api/backtest/summary` | Calibration + launch gate |
| POST | `/api/ingest/demo` | Seed demo NBA slate |
| POST | `/api/ingest/run` | Full pipeline |

## Non-goals (v1)

No live betting, no real-money wallets, no social, NBA only.

## License

Private / proprietary unless otherwise noted.

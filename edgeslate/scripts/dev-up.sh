#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
cp -n .env.example .env 2>/dev/null || true
docker compose up -d db
echo "Waiting for Postgres..."
until docker compose exec -T db pg_isready -U edgeslate -d edgeslate >/dev/null 2>&1; do sleep 1; done
echo "Postgres is ready."
echo "Next: cd backend && python -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt && uvicorn app.main:app --reload"

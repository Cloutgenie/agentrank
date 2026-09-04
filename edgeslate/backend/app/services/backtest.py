"""Backtest grading + calibration curve."""

from __future__ import annotations

from collections import defaultdict

from sqlalchemy.orm import Session

from app.db import models
from app.schemas.api import BacktestSummary, CalibrationBin
from app.services.demo_data import DEMO_HISTORICAL_PICKS


BUCKETS = [
    (0.50, 0.55, "50-55%"),
    (0.55, 0.60, "55-60%"),
    (0.60, 0.65, "60-65%"),
    (0.65, 0.70, "65-70%"),
    (0.70, 0.75, "70-75%"),
    (0.75, 0.85, "75-85%"),
]


def grade_final_games(db: Session) -> int:
    """Grade ungraded predictions whose games are final."""
    rows = (
        db.query(models.GamePrediction)
        .join(models.Game)
        .filter(models.GamePrediction.graded.is_(False), models.Game.status == "final")
        .all()
    )
    graded = 0
    for pred in rows:
        game = pred.game
        if game.home_score is None or game.away_score is None:
            continue
        home_won = game.home_score > game.away_score
        won = (pred.pick_side == "home" and home_won) or (pred.pick_side == "away" and not home_won)
        pred.graded = True
        pred.won = won
        # Closing line ≈ latest market_prob stored; keep as-is
        pred.closing_market_prob = pred.market_prob
        graded += 1
    db.commit()
    return graded


def _calibration(rows: list[dict]) -> list[CalibrationBin]:
    bins: dict[str, list[dict]] = defaultdict(list)
    for r in rows:
        p = r["model_prob"]
        for lo, hi, label in BUCKETS:
            if lo <= p < hi:
                bins[label].append(r)
                break
    out: list[CalibrationBin] = []
    for lo, hi, label in BUCKETS:
        group = bins.get(label, [])
        if not group:
            continue
        actual = sum(1 for g in group if g["won"]) / len(group)
        predicted = sum(g["model_prob"] for g in group) / len(group)
        out.append(
            CalibrationBin(
                bucket=label,
                predicted=round(predicted, 3),
                actual=round(actual, 3),
                count=len(group),
            )
        )
    return out


def backtest_summary(db: Session) -> BacktestSummary:
    graded = (
        db.query(models.GamePrediction)
        .filter(models.GamePrediction.graded.is_(True))
        .all()
    )
    rows = [{"model_prob": g.model_prob, "won": bool(g.won), "edge": g.edge_pp} for g in graded]

    using_demo = False
    if len(rows) < 50:
        # Seed synthetic historical curve so dashboard is useful pre-season / without keys
        rows = [
            {"model_prob": d["model_prob"], "won": d["won"], "edge": 3.0}
            for d in DEMO_HISTORICAL_PICKS
        ]
        using_demo = True

    wins = sum(1 for r in rows if r["won"])
    win_rate = wins / len(rows) if rows else 0.0
    avg_edge = sum(r["edge"] for r in rows) / len(rows) if rows else 0.0
    avg_model = sum(r["model_prob"] for r in rows) / len(rows) if rows else 0.0
    # Positive EV heuristic: win_rate > average model prob would be overconfident;
    # EV+ when actual win rate exceeds break-even vs market (~52% after vig for favorites blend)
    positive_ev = win_rate >= 0.54 and avg_edge > 0
    launch_ready = positive_ev and len(rows) >= 500

    notes = (
        "Demo calibration curve (synthetic graded history). Connect live feeds and grade finals for real EV."
        if using_demo
        else "Graded against closing market probabilities stored at pick time."
    )

    return BacktestSummary(
        total_picks=db.query(models.GamePrediction).count() if not using_demo else len(rows),
        graded_picks=len(rows),
        wins=wins,
        win_rate=round(win_rate, 4),
        avg_edge_pp=round(avg_edge, 2),
        avg_model_prob=round(avg_model, 4),
        positive_ev=positive_ev,
        launch_ready=launch_ready,
        calibration=_calibration(rows),
        notes=notes,
    )

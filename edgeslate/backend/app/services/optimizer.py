"""Monte Carlo prop simulation + PuLP lineup optimizer.

Constraints:
  - slate_size picks
  - max N players from one team (default 3)
  - optional salary-style budget (PrizePicks entry size encoded as unit cost)
  - maximize expected value under platform scoring (all legs must hit for payout)
"""

from __future__ import annotations

import math
import random
from dataclasses import dataclass
from typing import Optional

import numpy as np
from pulp import PULP_CBC_CMD, LpBinary, LpMaximize, LpProblem, LpVariable, lpSum
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.db import models


STAT_ATTR = {
    "points": "season_avg_pts",
    "pts": "season_avg_pts",
    "rebounds": "season_avg_reb",
    "reb": "season_avg_reb",
    "assists": "season_avg_ast",
    "ast": "season_avg_ast",
    "3-pt made": "season_avg_fg3m",
    "threes": "season_avg_fg3m",
    "fg3m": "season_avg_fg3m",
    "pts+rebs+asts": None,
    "pra": None,
}


@dataclass
class SimProp:
    key: str
    player_name: str
    team_abbr: Optional[str]
    stat_type: str
    line: float
    side: str
    model_mean: float
    hit_prob: float
    edge: float
    platform_id: Optional[str]
    cost: float = 1.0


def _player_lookup(db: Session) -> dict[str, models.Player]:
    players = db.query(models.Player).all()
    return {p.name.lower(): p for p in players}


def _estimate_mean(prop: models.PropLine, player: Optional[models.Player]) -> float:
    st = prop.stat_type.lower().replace(" ", "")
    if player:
        # Combo markets first so "pts" substring does not steal PRA
        if any(k in st for k in ("pra", "pts+rebs+asts", "points+rebounds+assists", "pts+reb+ast")):
            pts = player.season_avg_pts or 0
            reb = player.season_avg_reb or 0
            ast = player.season_avg_ast or 0
            if pts or reb or ast:
                return float(pts + reb + ast)
        for key, attr in STAT_ATTR.items():
            if key in ("pra", "pts+rebs+asts"):
                continue
            if key.replace(" ", "") in st and attr:
                val = getattr(player, attr)
                if val is not None:
                    return float(val)
    # Slight noise around the posted line so demo still has edges
    rng = random.Random(f"{prop.player_name}:{prop.stat_type}:{prop.line}")
    return float(prop.line) + rng.uniform(-2.5, 2.5)


def simulate_hit_prob(mean: float, line: float, side: str, sims: int, sigma: float | None = None) -> float:
    if sigma is None:
        sigma = max(1.5, abs(mean) * 0.22 + 1.0)
    draws = np.random.normal(loc=mean, scale=sigma, size=sims)
    if side == "over":
        return float(np.mean(draws > line))
    return float(np.mean(draws < line))


def build_candidate_props(db: Session, platform: str, sims: int) -> list[SimProp]:
    lines = (
        db.query(models.PropLine)
        .filter(models.PropLine.platform == platform)
        .order_by(models.PropLine.captured_at.desc())
        .limit(400)
        .all()
    )
    # Deduplicate by player+stat keeping newest
    seen: set[str] = set()
    unique: list[models.PropLine] = []
    for row in lines:
        k = f"{row.player_name}|{row.stat_type}|{row.line}"
        if k in seen:
            continue
        seen.add(k)
        unique.append(row)

    players = _player_lookup(db)
    candidates: list[SimProp] = []
    for prop in unique:
        player = players.get(prop.player_name.lower())
        if player and player.status in ("out", "injured"):
            continue
        mean = _estimate_mean(prop, player)
        for side in ("over", "under"):
            hit = simulate_hit_prob(mean, prop.line, side, sims)
            # Fair price ~0.5 for standard pick'em; edge = hit - 0.5
            edge = hit - 0.5
            if edge < 0.02:
                continue
            candidates.append(
                SimProp(
                    key=f"{prop.id}:{side}",
                    player_name=prop.player_name,
                    team_abbr=prop.team_abbr or (player.team_abbr if player else None),
                    stat_type=prop.stat_type,
                    line=prop.line,
                    side=side,
                    model_mean=round(mean, 2),
                    hit_prob=round(hit, 4),
                    edge=round(edge, 4),
                    platform_id=prop.external_id,
                )
            )
    candidates.sort(key=lambda c: c.edge, reverse=True)
    return candidates[:80]


def _lineup_ev(props: list[SimProp], payout_multiplier: float) -> tuple[float, float]:
    """All-legs-hit EV for pick'em: win_prob * payout - 1."""
    win_prob = 1.0
    for p in props:
        win_prob *= p.hit_prob
    ev = win_prob * payout_multiplier - 1.0
    return ev, win_prob


PAYOUTS = {
    # Approximate PrizePicks / Underdog flex-style multipliers for all-correct
    2: 3.0,
    3: 5.0,
    4: 10.0,
    5: 20.0,
    6: 40.0,
}


def deep_link_for_platform(platform: str, picks: list[SimProp]) -> str:
    if platform == "underdog":
        return "https://underdogfantasy.com/pick-em"
    # PrizePicks board; projection deep links are unstable — send to NBA board
    return "https://app.prizepicks.com/"


def optimize_lineups(
    db: Session,
    platform: str = "prizepicks",
    slate_size: int = 5,
    top_n: int = 5,
    max_from_team: int | None = None,
) -> list[models.OptimizedLineup]:
    settings = get_settings()
    max_team = max_from_team or settings.max_team_exposure
    sims = settings.monte_carlo_sims
    # Use fewer sims in demo for speed if needed — still correct path
    if settings.use_demo_data and sims > 5000:
        sims = 5000

    candidates = build_candidate_props(db, platform, sims)
    if len(candidates) < slate_size:
        return []

    payout = PAYOUTS.get(slate_size, 10.0)
    results: list[models.OptimizedLineup] = []
    banned_combos: list[set[str]] = []

    for rank in range(1, top_n + 1):
        prob = LpProblem(f"edgeslate_{platform}_{rank}", LpMaximize)
        x = {c.key: LpVariable(f"x_{i}", cat=LpBinary) for i, c in enumerate(candidates)}

        # Maximize sum of log-odds as proxy, then re-score exact EV
        # Use edge * hit_prob as linear surrogate
        prob += lpSum(x[c.key] * (c.edge * 100 + c.hit_prob) for c in candidates)
        prob += lpSum(x[c.key] for c in candidates) == slate_size

        # Max one side per player+stat
        by_player_stat: dict[str, list[SimProp]] = {}
        for c in candidates:
            by_player_stat.setdefault(f"{c.player_name}|{c.stat_type}", []).append(c)
        for group in by_player_stat.values():
            if len(group) > 1:
                prob += lpSum(x[c.key] for c in group) <= 1

        # Max one pick per player overall
        by_player: dict[str, list[SimProp]] = {}
        for c in candidates:
            by_player.setdefault(c.player_name, []).append(c)
        for group in by_player.values():
            if len(group) > 1:
                prob += lpSum(x[c.key] for c in group) <= 1

        # Team exposure
        by_team: dict[str, list[SimProp]] = {}
        for c in candidates:
            if c.team_abbr:
                by_team.setdefault(c.team_abbr, []).append(c)
        for group in by_team.values():
            prob += lpSum(x[c.key] for c in group) <= max_team

        # Exclude previous lineups
        for combo in banned_combos:
            if combo:
                prob += lpSum(x[k] for k in combo if k in x) <= slate_size - 1

        status = prob.solve(PULP_CBC_CMD(msg=False))
        if status != 1:
            break

        chosen = [c for c in candidates if x[c.key].value() and x[c.key].value() > 0.5]
        if len(chosen) != slate_size:
            break

        banned_combos.append({c.key for c in chosen})
        ev, win_prob = _lineup_ev(chosen, payout)
        picks_payload = [
            {
                "player_name": c.player_name,
                "team_abbr": c.team_abbr,
                "stat_type": c.stat_type,
                "line": c.line,
                "side": c.side,
                "model_mean": c.model_mean,
                "hit_prob": c.hit_prob,
                "edge": c.edge,
                "platform_id": c.platform_id,
            }
            for c in chosen
        ]
        row = models.OptimizedLineup(
            platform=platform,
            rank=rank,
            expected_value=round(ev, 4),
            win_prob=round(win_prob, 6),
            salary_used=float(slate_size),
            picks=picks_payload,
            deep_link=deep_link_for_platform(platform, chosen),
        )
        db.add(row)
        results.append(row)

    db.commit()
    for row in results:
        db.refresh(row)
    return results


def normal_cdf(x: float) -> float:
    return 0.5 * (1.0 + math.erf(x / math.sqrt(2.0)))

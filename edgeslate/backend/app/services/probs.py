"""Shared probability helpers."""

from __future__ import annotations

import math


def american_to_implied(american: float) -> float:
    """Convert American odds to raw implied probability (includes vig)."""
    if american == 0:
        return 0.5
    if american > 0:
        return 100.0 / (american + 100.0)
    return abs(american) / (abs(american) + 100.0)


def decimal_to_implied(decimal_odds: float) -> float:
    if decimal_odds <= 1:
        return 1.0
    return 1.0 / decimal_odds


def remove_vig_two_way(p_a: float, p_b: float) -> tuple[float, float]:
    total = p_a + p_b
    if total <= 0:
        return 0.5, 0.5
    return p_a / total, p_b / total


def elo_win_prob(elo_a: float, elo_b: float, home_advantage: float = 60.0) -> float:
    """P(A beats B) with home-court Elo bump applied to A when A is home."""
    diff = (elo_a + home_advantage) - elo_b
    return 1.0 / (1.0 + math.pow(10.0, -diff / 400.0))


def blend_probs(market: float, elo: float, market_w: float, elo_w: float) -> float:
    total = market_w + elo_w
    if total <= 0:
        return market
    return (market_w * market + elo_w * elo) / total


def clamp(x: float, lo: float = 0.01, hi: float = 0.99) -> float:
    return max(lo, min(hi, x))

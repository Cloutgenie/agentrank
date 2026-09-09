"""
Desk 0DTE backtester — quote-level (bid/ask), never OHLC.

Rules mirror lib/desk (TypeScript):
  regime → structure → strikes → size → mechanical exits

Fill model: sell short at bid, buy wing at ask; exit BTC at ask (conservative).
Wire ThetaData / ORATS adapters into QuoteFeed for live historical quotes.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from typing import Iterable, Literal, Optional


MULTIPLIER = 100


class Regime(str, Enum):
    TREND = "trend"
    RANGE = "range"
    VOL_EXPANSION = "vol_expansion"
    REFUSE = "refuse"


class StructureKind(str, Enum):
    BULL_PUT = "bull_put_vertical"
    BEAR_CALL = "bear_call_vertical"
    IRON_CONDOR = "iron_condor"
    NO_TRADE = "no_trade"


@dataclass
class Quote:
    strike: float
    right: Literal["C", "P"]
    bid: float
    ask: float
    delta: float
    ts: str  # ISO timestamp

    @property
    def mid(self) -> float:
        return round((self.bid + self.ask) / 2, 2)


@dataclass
class MarketBar:
    """Session context — still needs a full option quote chain, not OHLC bars for fills."""

    symbol: str
    underlying: float
    vwap: float
    vix: float
    gex: float
    or_high: float
    or_low: float
    session_progress: float
    as_of: str
    chain: list[Quote] = field(default_factory=list)


@dataclass
class RiskLimits:
    account_equity: float = 100_000
    risk_per_trade: float = 0.015
    daily_loss_limit: float = 0.03
    day_pnl: float = 0.0


@dataclass
class ExitPlan:
    take_profit: float
    stop_loss: float
    time_exit_et: str


@dataclass
class TradeTicket:
    kind: StructureKind
    legs: list[tuple[str, str, float]]  # side, right, strike
    credit: float
    width: float
    contracts: int
    max_loss: float
    exits: ExitPlan
    regime: Regime


@dataclass
class TradeResult:
    ticket: TradeTicket
    exit_reason: Literal["tp", "sl", "time", "held"]
    pnl: float
    entry_credit: float
    exit_debit: float


def classify_regime(m: MarketBar) -> tuple[Regime, float, bool, list[str]]:
    reasons: list[str] = []
    negative_gex = m.gex < 0
    vix_hot = m.vix >= 25
    vix_elevated = m.vix >= 20
    inside = m.or_low <= m.underlying <= m.or_high

    if negative_gex and vix_hot:
        reasons.append("Negative GEX + hot VIX — refuse premium sales")
        return Regime.REFUSE, 0.0, False, reasons

    if negative_gex and vix_elevated:
        reasons.append("Negative GEX — cut size")
        return Regime.VOL_EXPANSION, 0.35, True, reasons

    if vix_hot:
        return Regime.VOL_EXPANSION, 0.65, True, ["Elevated VIX — vol expansion"]

    if inside:
        return Regime.RANGE, 1.0 if not negative_gex else 0.5, True, ["Inside OR — range"]

    return Regime.TREND, 0.85 if negative_gex else 1.0, True, ["OR break — trend"]


def select_structure(m: MarketBar, regime: Regime) -> StructureKind:
    if regime == Regime.REFUSE:
        return StructureKind.NO_TRADE
    if regime == Regime.RANGE:
        return StructureKind.IRON_CONDOR
    above = m.underlying >= m.vwap
    if regime == Regime.VOL_EXPANSION:
        return StructureKind.BEAR_CALL if above else StructureKind.BULL_PUT
    return StructureKind.BULL_PUT if above else StructureKind.BEAR_CALL


def _pick_by_delta(quotes: list[Quote], target: float, spot: float | None = None) -> Optional[Quote]:
    if not quotes:
        return None
    pool = quotes
    if spot is not None:
        otm = [
            q
            for q in quotes
            if (q.right == "P" and q.strike < spot) or (q.right == "C" and q.strike > spot)
        ]
        if otm:
            pool = otm
    return min(pool, key=lambda q: abs(abs(q.delta) - abs(target)))


def _net_credit(short: Quote, long: Quote) -> float:
    # Sell at bid, buy wing at ask — never mid for 0DTE realism
    return max(0.05, short.bid - long.ask)


def build_vertical(
    chain: list[Quote],
    right: Literal["C", "P"],
    width: float,
    short_delta: float = 0.16,
    spot: float | None = None,
) -> Optional[tuple[list[tuple[str, str, float]], float, float]]:
    side = [q for q in chain if q.right == right]
    short = _pick_by_delta(side, short_delta if right == "C" else -short_delta, spot)
    if not short:
        return None
    wing_strike = short.strike - width if right == "P" else short.strike + width
    candidates = [q for q in side if q.strike != short.strike]
    if not candidates:
        return None
    long = min(candidates, key=lambda q: abs(q.strike - wing_strike))
    # Ensure wing is on the correct side
    if right == "P" and long.strike >= short.strike:
        lower = [q for q in candidates if q.strike < short.strike]
        if not lower:
            return None
        long = min(lower, key=lambda q: abs(q.strike - wing_strike))
    if right == "C" and long.strike <= short.strike:
        higher = [q for q in candidates if q.strike > short.strike]
        if not higher:
            return None
        long = min(higher, key=lambda q: abs(q.strike - wing_strike))
    credit = _net_credit(short, long)
    used_width = abs(short.strike - long.strike)
    legs = [("short", right, short.strike), ("long", right, long.strike)]
    return legs, credit, used_width


def size_contracts(max_loss_per: float, risk: RiskLimits, mult: float) -> int:
    daily_cap = risk.account_equity * risk.daily_loss_limit
    room = daily_cap + risk.day_pnl
    if room <= 0 or max_loss_per <= 0:
        return 0
    budget = min(risk.account_equity * risk.risk_per_trade * mult, room)
    return max(0, int(budget // max_loss_per))


def define_exits(credit: float, session_progress: float) -> ExitPlan:
    return ExitPlan(
        take_profit=round(credit * 0.5, 2),
        stop_loss=round(credit * 2.0, 2),
        time_exit_et="14:30 ET" if session_progress > 0.75 else "15:00 ET",
    )


def build_ticket(m: MarketBar, risk: RiskLimits | None = None) -> Optional[TradeTicket]:
    risk = risk or RiskLimits()
    regime, mult, allow, _ = classify_regime(m)
    if not allow or regime == Regime.REFUSE:
        return None
    kind = select_structure(m, regime)
    if kind == StructureKind.NO_TRADE:
        return None

    width = 10.0 if m.underlying > 4000 else 2.0 if m.underlying > 400 else 1.0
    if kind == StructureKind.BULL_PUT:
        built = build_vertical(m.chain, "P", width, spot=m.underlying)
    elif kind == StructureKind.BEAR_CALL:
        built = build_vertical(m.chain, "C", width, spot=m.underlying)
    else:
        put = build_vertical(m.chain, "P", width, spot=m.underlying)
        call = build_vertical(m.chain, "C", width, spot=m.underlying)
        if not put or not call:
            return None
        legs = put[0] + call[0]
        credit = put[1] + call[1]
        used_width = max(put[2], call[2])
        built = (legs, credit, used_width)

    if not built:
        return None
    legs, credit, used_width = built
    max_loss_per = max(0.0, (used_width - credit) * MULTIPLIER)
    contracts = size_contracts(max_loss_per, risk, mult)
    if contracts < 1:
        return None
    return TradeTicket(
        kind=kind,
        legs=legs,
        credit=round(credit, 2),
        width=used_width,
        contracts=contracts,
        max_loss=round(max_loss_per * contracts, 2),
        exits=define_exits(credit, m.session_progress),
        regime=regime,
    )


def simulate_exit(
    ticket: TradeTicket,
    marks: Iterable[float],
) -> TradeResult:
    """
    marks: sequence of mark prices to buy-to-close the spread (debit).
    TP when mark <= take_profit; SL when mark >= stop_loss; else time.
    """
    entry = ticket.credit
    marks_list = list(marks)
    for mark in marks_list:
        if mark <= ticket.exits.take_profit:
            pnl = (entry - mark) * MULTIPLIER * ticket.contracts
            return TradeResult(ticket, "tp", round(pnl, 2), entry, mark)
        if mark >= ticket.exits.stop_loss:
            pnl = (entry - mark) * MULTIPLIER * ticket.contracts
            return TradeResult(ticket, "sl", round(pnl, 2), entry, mark)
    last = marks_list[-1] if marks_list else entry
    pnl = (entry - last) * MULTIPLIER * ticket.contracts
    return TradeResult(ticket, "time", round(pnl, 2), entry, last)


class QuoteFeed:
    """Implement with ThetaData or ORATS — never substitute OHLC for fills."""

    def session_snapshots(self, symbol: str, date: str) -> list[MarketBar]:
        raise NotImplementedError("Wire ThetaData/ORATS quote history here")


def demo_chain(spot: float = 5624.5) -> list[Quote]:
    step = 5.0 if spot > 4000 else 1.0
    out: list[Quote] = []
    for i in range(-60, 61):
        strike = round(spot + i * step)
        mny = (strike - spot) / spot
        call_delta = max(0.01, min(0.99, 0.5 - mny * 22))
        put_delta = max(-0.99, min(-0.01, call_delta - 1))
        call_mid = max(0.05, spot * 0.0012 * min(call_delta, 1 - call_delta) * 2)
        put_mid = max(0.05, spot * 0.0012 * min(abs(put_delta), 1 - abs(put_delta)) * 2)
        for right, delta, mid in (("C", call_delta, call_mid), ("P", put_delta, put_mid)):
            spread = max(0.05, mid * 0.08)
            out.append(
                Quote(
                    strike=strike,
                    right=right,  # type: ignore[arg-type]
                    bid=round(max(0.01, mid - spread / 2), 2),
                    ask=round(mid + spread / 2, 2),
                    delta=round(delta, 2),
                    ts="2026-09-04T14:42:00Z",
                )
            )
    return out


if __name__ == "__main__":
    m = MarketBar(
        symbol="SPX",
        underlying=5624.5,
        vwap=5619.2,
        vix=14.8,
        gex=2.4e9,
        or_high=5632,
        or_low=5608,
        session_progress=0.35,
        as_of="10:42 ET",
        chain=demo_chain(),
    )
    ticket = build_ticket(m)
    if not ticket:
        print("NO TRADE")
    else:
        print(f"{ticket.kind.value} credit={ticket.credit} contracts={ticket.contracts}")
        print(f"TP={ticket.exits.take_profit} SL={ticket.exits.stop_loss} by {ticket.exits.time_exit_et}")
        # Path: credit decays then hits TP
        result = simulate_exit(ticket, [ticket.credit * 0.9, ticket.credit * 0.7, ticket.exits.take_profit])
        print(f"exit={result.exit_reason} pnl=${result.pnl}")

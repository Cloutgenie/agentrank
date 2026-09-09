"""Broker execution adapters — paper first, then live small.

IBKR (ib_insync) and tastytrade are the intended live paths.
This module defines the order shape Desk emits; wire credentials via env.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Literal, Protocol


@dataclass
class BracketTicket:
    symbol: str
    structure: str
    legs: list[dict]
    quantity: int
    entry_credit: float
    take_profit: float
    stop_loss: float
    time_exit_et: str
    mode: Literal["paper", "live"] = "paper"


class Broker(Protocol):
    def place_defined_risk(self, ticket: BracketTicket) -> str:
        """Place STO + TP/SL brackets. Returns broker order id."""
        ...

    def cancel_all(self) -> None: ...


class PaperBroker:
    """Local paper blotter — no network."""

    def __init__(self) -> None:
        self.orders: list[BracketTicket] = []

    def place_defined_risk(self, ticket: BracketTicket) -> str:
        self.orders.append(ticket)
        return f"paper-{len(self.orders)}"

    def cancel_all(self) -> None:
        self.orders.clear()


# Future:
# class IbkrBroker: ...
# class TastytradeBroker: ...

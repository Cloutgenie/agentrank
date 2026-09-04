import type { PositionSize, RiskLimits, TradeStructure } from "./types";

export function sizePosition(
  structure: TradeStructure,
  limits: RiskLimits,
  sizeMultiplier = 1
): PositionSize {
  if (limits.dailyLossLimit <= 0 || limits.riskPerTrade <= 0) {
    return blocked("Invalid risk limits");
  }

  const dailyCap = limits.accountEquity * limits.dailyLossLimit;
  const room = dailyCap + limits.dayPnl;

  if (room <= 0 || limits.dayPnl <= -dailyCap) {
    return blocked("Daily loss limit hit — stop trading");
  }

  const targetRisk = limits.accountEquity * limits.riskPerTrade * sizeMultiplier;
  const riskBudget = Math.min(targetRisk, room);

  if (structure.maxLossPerContract <= 0) {
    return blocked("Max loss per contract is zero — cannot size");
  }

  const contracts = Math.floor(riskBudget / structure.maxLossPerContract);
  if (contracts < 1) {
    return blocked(
      `Risk budget $${riskBudget.toFixed(0)} < max loss/contract $${structure.maxLossPerContract.toFixed(0)}`
    );
  }

  const riskDollars = contracts * structure.maxLossPerContract;
  return {
    contracts,
    riskDollars: round2(riskDollars),
    riskPct: round2((riskDollars / limits.accountEquity) * 100),
    blocked: false,
  };
}

function blocked(blockReason: string): PositionSize {
  return { contracts: 0, riskDollars: 0, riskPct: 0, blocked: true, blockReason };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function maxLossDollars(width: number, credit: number, contracts: number): number {
  return Math.max(0, (width - credit) * 100 * contracts);
}

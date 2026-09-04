import type { ExitPlan, TradeStructure } from "./types";

/**
 * Exits are mechanical.
 * Fifty percent profit target, two-times-credit stop,
 * time-based exit before the final gamma spike.
 */
export function defineExits(structure: TradeStructure, sessionProgress = 0.4): ExitPlan {
  const credit = structure.credit;
  const takeProfitPct = 0.5;
  // Buy-to-close at 50% of credit remaining
  const takeProfitPrice = round2(credit * (1 - takeProfitPct));
  // Stop at 2× credit (debit to close = 2 × credit received)
  const stopMultiple = 2;
  const stopLossPrice = round2(credit * stopMultiple);

  // Final 0DTE gamma spike clusters into the last ~60–90 minutes.
  // Hard exit by 15:00 ET (or earlier if already late in session).
  const timeExitEt = sessionProgress > 0.75 ? "14:30 ET" : "15:00 ET";

  const notes = [
    `Close at ~${(takeProfitPct * 100).toFixed(0)}% of credit (BTC ${takeProfitPrice.toFixed(2)})`,
    `Stop if mark reaches ${stopMultiple}× credit (BTC ${stopLossPrice.toFixed(2)})`,
    `Flat by ${timeExitEt} — before the final gamma spike`,
  ];

  return {
    takeProfitPrice,
    stopLossPrice,
    takeProfitPct,
    stopMultiple,
    timeExitEt,
    notes,
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

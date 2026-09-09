import { SETTINGS } from "./brand";
import type { ExitPlan, TradeStructure } from "./types";

export function defineExits(structure: TradeStructure, sessionProgress = 0.4): ExitPlan {
  const credit = structure.credit;
  const takeProfitPct = SETTINGS.takeProfitPct;
  const takeProfitPrice = round2(credit * (1 - takeProfitPct));
  const stopMultiple = SETTINGS.stopMultiple;
  const stopLossPrice = round2(credit * stopMultiple);
  const timeExitEt =
    sessionProgress > SETTINGS.lateSessionProgress
      ? SETTINGS.lateSessionExitEt
      : SETTINGS.timeExitEt;

  return {
    takeProfitPrice,
    stopLossPrice,
    takeProfitPct,
    stopMultiple,
    timeExitEt,
    notes: [
      `Close at ~${(takeProfitPct * 100).toFixed(0)}% of credit (BTC ${takeProfitPrice.toFixed(2)})`,
      `Stop if mark reaches ${stopMultiple}× credit (BTC ${stopLossPrice.toFixed(2)})`,
      `Flat by ${timeExitEt} — before the final gamma spike`,
    ],
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

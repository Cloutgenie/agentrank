import { SETTINGS } from "./brand";
import type { ExitPlan, TradeStructure } from "./types";

/**
 * Long Call / Put exits (Robinhood-simple):
 * - Take profit when premium is up ~takeProfitPct
 * - Stop when premium is down ~stopLossPct
 * - Flat by timeExitEt
 */
export function defineExits(structure: TradeStructure, sessionProgress = 0.4): ExitPlan {
  const entry = structure.debit;
  const takeProfitPct = SETTINGS.takeProfitPct;
  const stopLossPct = SETTINGS.stopLossPct;
  const takeProfitPrice = round2(entry * (1 + takeProfitPct));
  const stopLossPrice = round2(Math.max(0.01, entry * (1 - stopLossPct)));
  const timeExitEt =
    sessionProgress > SETTINGS.lateSessionProgress
      ? SETTINGS.lateSessionExitEt
      : SETTINGS.timeExitEt;

  return {
    takeProfitPrice,
    stopLossPrice,
    takeProfitPct,
    stopMultiple: stopLossPct,
    timeExitEt,
    notes: [
      `Sell when up ~${(takeProfitPct * 100).toFixed(0)}% ($${takeProfitPrice.toFixed(2)})`,
      `Cut when down ~${(stopLossPct * 100).toFixed(0)}% ($${stopLossPrice.toFixed(2)})`,
      `Flat by ${timeExitEt} — 0DTE dies into the close`,
    ],
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

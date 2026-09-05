import { SETTINGS } from "./brand";
import type { ExitPlan, TradeStructure } from "./types";

/**
 * Long Call / Put exits + when to take the play (Robinhood-simple):
 * - Take the play now, no later than enterBy
 * - Take profit when premium is up ~takeProfitPct
 * - Stop when premium is down ~stopLossPct
 * - Flat by timeExitEt
 */
export function defineExits(
  structure: TradeStructure,
  sessionProgress = 0.4,
  asOf = "10:42 ET"
): ExitPlan {
  const entry = structure.debit;
  const takeProfitPct = SETTINGS.takeProfitPct;
  const stopLossPct = SETTINGS.stopLossPct;
  const takeProfitPrice = round2(entry * (1 + takeProfitPct));
  const stopLossPrice = round2(Math.max(0.01, entry * (1 - stopLossPct)));
  const timeExitEt =
    sessionProgress > SETTINGS.lateSessionProgress
      ? SETTINGS.lateSessionExitEt
      : SETTINGS.timeExitEt;

  const { takeAt, enterBy } = entryTiming(asOf, sessionProgress);

  return {
    takeProfitPrice,
    stopLossPrice,
    takeProfitPct,
    stopMultiple: stopLossPct,
    takeAt,
    enterBy,
    timeExitEt,
    notes: [
      `Take the play ${takeAt} — open by ${enterBy}`,
      `Sell when up ~${(takeProfitPct * 100).toFixed(0)}% ($${takeProfitPrice.toFixed(2)})`,
      `Cut when down ~${(stopLossPct * 100).toFixed(0)}% ($${stopLossPrice.toFixed(2)})`,
      `Flat by ${timeExitEt} — 0DTE dies into the close`,
    ],
  };
}

/** Build take-at / enter-by times from the quote clock. */
export function entryTiming(
  asOf: string,
  sessionProgress = 0.4
): { takeAt: string; enterBy: string } {
  const signal = parseEtClock(asOf) ?? { hours: 10, minutes: 42 };
  const windowMin =
    sessionProgress > SETTINGS.lateSessionProgress
      ? Math.min(10, SETTINGS.entryWindowMinutes)
      : SETTINGS.entryWindowMinutes;

  const deadline = addMinutes(signal, windowMin);
  const lastEntry = parseEtClock(SETTINGS.lastEntryEt) ?? { hours: 13, minutes: 30 };
  const capped = earlierOf(deadline, lastEntry);

  const enterBy = formatEt(capped);
  // If the signal is already past last entry, still show the clock but label clearly.
  if (toMinutes(signal) >= toMinutes(lastEntry)) {
    return {
      takeAt: `Too late after ${SETTINGS.lastEntryEt}`,
      enterBy: SETTINGS.lastEntryEt,
    };
  }

  return {
    takeAt: `Now (${formatEt(signal)})`,
    enterBy,
  };
}

function parseEtClock(label: string): { hours: number; minutes: number } | null {
  const m = label.match(/(\d{1,2}):(\d{2})\s*ET/i);
  if (!m) return null;
  const hours = Number(m[1]);
  const minutes = Number(m[2]);
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  return { hours, minutes };
}

function addMinutes(
  t: { hours: number; minutes: number },
  add: number
): { hours: number; minutes: number } {
  const total = t.hours * 60 + t.minutes + add;
  return { hours: Math.floor(total / 60) % 24, minutes: total % 60 };
}

function earlierOf(
  a: { hours: number; minutes: number },
  b: { hours: number; minutes: number }
): { hours: number; minutes: number } {
  return toMinutes(a) <= toMinutes(b) ? a : b;
}

function toMinutes(t: { hours: number; minutes: number }): number {
  return t.hours * 60 + t.minutes;
}

function formatEt(t: { hours: number; minutes: number }): string {
  return `${t.hours}:${String(t.minutes).padStart(2, "0")} ET`;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

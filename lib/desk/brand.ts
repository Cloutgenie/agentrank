export const BRAND = {
  name: "REDZONE",
  tagline: "Only the play that matters.",
  domainHint: "redzone.desk",
} as const;

/** Default bankroll shown in the desk — enter starting money, get the play. */
export const DEFAULT_STARTING_MONEY = 100;

/** Calibrated for Robinhood-simple long Call / Put. */
export const SETTINGS = {
  /** Starter mode: the whole starting bankroll is the risk budget for the one play. */
  riskPerTrade: 1,
  dailyLossLimit: 1,
  /** Target delta for the Call / Put (~25Δ). */
  targetDelta: 0.25,
  /** @deprecated alias — same as targetDelta */
  shortDelta: 0.25,
  /** Take profit: +50% on the premium you paid. */
  takeProfitPct: 0.5,
  /** Stop loss: −50% on the premium you paid. */
  stopLossPct: 0.5,
  /** Kept for exit-plan typing; equals stopLossPct. */
  stopMultiple: 0.5,
  /** Minutes after the signal the user still has to take the play. */
  entryWindowMinutes: 15,
  /** Do not open new 0DTE plays after this clock time. */
  lastEntryEt: "13:30 ET",
  timeExitEt: "15:00 ET",
  lateSessionExitEt: "14:30 ET",
  lateSessionProgress: 0.75,
  maxTradesPerDay: 3,
  vixElevated: 20,
  vixHot: 25,
  putCallFear: 1.15,
  putCallComplacency: 0.65,
  headlineRefuseAbs: 0.75,
  headlineCutAbs: 0.4,
  newsBlackoutEvents: ["FOMC", "CPI", "NFP", "PPI", "GDP", "PCE"] as const,
} as const;

export const BRAND = {
  name: "REDZONE",
  tagline: "Only the play that matters.",
  domainHint: "redzone.desk",
} as const;

/** Default bankroll shown in the desk — enter starting money, get the play. */
export const DEFAULT_STARTING_MONEY = 100;

/** Calibrated from SpotGamma / FlashAlpha / tasty-style 0DTE + prop risk. */
export const SETTINGS = {
  /** Starter mode: the whole starting bankroll is the risk budget for the one play. */
  riskPerTrade: 1,
  dailyLossLimit: 1,
  shortDelta: 0.16,
  takeProfitPct: 0.5,
  stopMultiple: 2,
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

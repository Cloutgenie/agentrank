export type {
  DeskPlay,
  ExitPlan,
  MarketSnapshot,
  Regime,
  RegimeResult,
  RiskLimits,
  Side,
  StructureKind,
  TradeStructure,
} from "./types";
export { BRAND, SETTINGS, DEFAULT_STARTING_MONEY } from "./brand";
export {
  evaluateSentiment,
  demoSentiment,
  demoNewsBlackoutSentiment,
  attachSentiment,
} from "./sentiment";
export { classifyRegime, inferGexSign } from "./regime";
export { selectStructure } from "./structure";
export { buildStructure, synthesizeChain } from "./strikes";
export { sizePosition, maxLossDollars } from "./sizing";
export { defineExits } from "./exits";
export {
  runRulesEngine,
  scanForPlays,
  demoMarket,
  demoDangerMarket,
  DEFAULT_RISK,
} from "./engine";
export { structureLabel, legsSummary, riskFromStartingMoney } from "./market";
export {
  demoFeedStatus,
  detectFeedConfig,
  explainLiveData,
  fetchLiveSnapshot,
  type FeedStatus,
  type FeedMode,
} from "./feed";

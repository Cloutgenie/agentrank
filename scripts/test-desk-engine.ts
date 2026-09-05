import assert from "node:assert/strict";
import {
  classifyRegime,
  demoDangerMarket,
  demoMarket,
  explainLiveData,
  riskFromStartingMoney,
  runRulesEngine,
  scanForPlays,
} from "../lib/desk";

const calm = demoMarket({
  symbol: "SPY",
  underlying: 562.4,
  vwap: 561.9,
  orHigh: 563.2,
  orLow: 560.8,
});
const calmRegime = classifyRegime(calm);
assert.notEqual(calmRegime.regime, "refuse");
assert.ok(calmRegime.allowPremiumSale);

const danger = demoDangerMarket();
const dangerRegime = classifyRegime(danger);
assert.equal(dangerRegime.regime, "refuse");
assert.equal(dangerRegime.sizeMultiplier, 0);

const starter = riskFromStartingMoney(100);
const play = runRulesEngine({ market: calm, risk: starter });
assert.equal(play.refused, false, play.message);
assert.ok(play.play);
assert.ok(play.play.side === "Call" || play.play.side === "Put");
assert.equal(play.play.ticket.action, "BUY_TO_OPEN");
assert.ok(play.play.ticket.entry > 0);
// Long option: TP above entry, SL below entry
assert.ok(play.play.ticket.takeProfit > play.play.ticket.entry);
assert.ok(play.play.ticket.stopLoss < play.play.ticket.entry);
assert.ok(play.play.ticket.contracts >= 1);
assert.ok(play.play.ticket.maxLoss <= 100 + 1e-6);

assert.ok(play.play.ticket.takeAt);
assert.ok(play.play.ticket.enterBy);
assert.match(play.play.ticket.summary, /Take |open by/i);

const scan = scanForPlays({ risk: starter });
assert.ok(scan.primary, scan.refusedMessage);
assert.ok(scan.primary.ticket.maxLoss <= 100 + 1e-6);
assert.ok(scan.primary.ticket.takeAt);
assert.ok(scan.primary.ticket.enterBy);
assert.equal(scan.feed.mode, "demo");
assert.ok(explainLiveData().includes("ThetaData") || explainLiveData().includes("ORATS"));

console.log("desk engine ok");
console.log(`$100 start → ${scan.primary.side} · ${scan.primary.ticket.summary}`);
console.log(`take: ${scan.primary.ticket.takeAt} · open by ${scan.primary.ticket.enterBy}`);
console.log(`feed: ${scan.feed.message}`);

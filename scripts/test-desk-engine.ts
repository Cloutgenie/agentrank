import assert from "node:assert/strict";
import {
  classifyRegime,
  demoDangerMarket,
  demoMarket,
  runRulesEngine,
  scanForPlays,
  DEFAULT_RISK,
} from "../lib/desk";

const calm = demoMarket();
const calmRegime = classifyRegime(calm);
assert.notEqual(calmRegime.regime, "refuse");
assert.ok(calmRegime.allowPremiumSale);

const danger = demoDangerMarket();
const dangerRegime = classifyRegime(danger);
assert.equal(dangerRegime.regime, "refuse");
assert.equal(dangerRegime.sizeMultiplier, 0);

const play = runRulesEngine({
  market: calm,
  risk: { ...DEFAULT_RISK, accountEquity: 100_000 },
});
assert.equal(play.refused, false, play.message);
assert.ok(play.play);
assert.ok(play.play.ticket.entry > 0);
assert.ok(play.play.ticket.takeProfit < play.play.ticket.entry);
assert.ok(play.play.ticket.stopLoss > play.play.ticket.entry);
assert.ok(play.play.ticket.contracts >= 1);
assert.ok(play.play.ticket.maxLoss > 0);

const dailyHit = runRulesEngine({
  market: calm,
  risk: { ...DEFAULT_RISK, accountEquity: 100_000, dayPnl: -3_000 },
});
assert.equal(dailyHit.refused, true);

const scan = scanForPlays({ risk: { ...DEFAULT_RISK, accountEquity: 100_000 } });
assert.ok(scan.primary);
assert.ok(scan.plays.length >= 1);

console.log("desk engine ok");
console.log(scan.primary.ticket.summary);

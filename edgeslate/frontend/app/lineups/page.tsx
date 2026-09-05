"use client";

import { useEffect, useState } from "react";
import { Nav } from "@/components/Nav";
import { SportSwitcher } from "@/components/SportSwitcher";
import { EdgePill, GhostButton, PrimaryButton, Segmented } from "@/components/ui";
import { client, pct, type Lineup, type SportId } from "@/lib/api";

export default function LineupsPage() {
  const [sport, setSport] = useState<SportId>("NFL");
  const [platform, setPlatform] = useState<"prizepicks" | "underdog">("prizepicks");
  const [lineups, setLineups] = useState<Lineup[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadCached(nextSport: SportId = sport, nextPlatform = platform) {
    setError(null);
    try {
      setLineups(await client.lineups(nextPlatform, nextSport));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    }
  }

  useEffect(() => {
    loadCached(sport, platform);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [platform, sport]);

  async function optimize() {
    setLoading(true);
    setError(null);
    try {
      setLineups(await client.optimize(platform, sport, 5));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Optimize failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen">
      <Nav active="/lineups" />
      <div className="mx-auto max-w-3xl px-4 pb-24 pt-6 md:px-8">
        <div className="animate-rise flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-lime">DFS slips</p>
            <h1 className="mt-1 font-display text-4xl uppercase tracking-tight md:text-5xl">
              Lineup lab
            </h1>
            <p className="mt-2 max-w-md text-sm text-mute">
              Monte Carlo sims for NFL / CFB / NBA · max 3 from one team · PrizePicks &amp; Underdog.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <SportSwitcher value={sport} onChange={setSport} />
            <Segmented
              value={platform}
              onChange={setPlatform}
              options={[
                { id: "prizepicks", label: "PrizePicks" },
                { id: "underdog", label: "Underdog" },
              ]}
            />
            <GhostButton onClick={optimize} disabled={loading}>
              {loading ? "Simulating…" : "Run opt"}
            </GhostButton>
          </div>
        </div>

        {error && (
          <p className="mt-8 rounded-2xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
            {error}
          </p>
        )}

        <div className="mt-8 space-y-5">
          {lineups.map((lu) => (
            <article
              key={`${lu.platform}-${lu.sport}-${lu.rank}-${lu.expected_value}`}
              className="pick-card p-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="font-display text-3xl uppercase">#{lu.rank}</span>
                  <EdgePill>EV {(lu.expected_value * 100).toFixed(1)}%</EdgePill>
                  <EdgePill tone="mute">Win {pct(lu.win_prob, 2)}</EdgePill>
                  <EdgePill tone="mute">{lu.sport || sport}</EdgePill>
                </div>
                {lu.deep_link && (
                  <PrimaryButton href={lu.deep_link}>Open {platform}</PrimaryButton>
                )}
              </div>

              <ul className="mt-4 space-y-2">
                {lu.picks.map((pick) => {
                  const over = pick.side === "over";
                  return (
                    <li
                      key={`${pick.player_name}-${pick.stat_type}-${pick.side}`}
                      className="rounded-2xl border border-line bg-void/60 p-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-bold text-mist">
                            {pick.player_name}
                            {pick.team_abbr ? (
                              <span className="ml-2 text-xs text-mute">{pick.team_abbr}</span>
                            ) : null}
                          </p>
                          <p className="mt-0.5 text-sm text-mute">
                            {pick.stat_type} · {pick.line} · model {pick.model_mean}
                          </p>
                        </div>
                        <EdgePill>{pct(pick.hit_prob)}</EdgePill>
                      </div>
                      <div className="side-toggle mt-3">
                        <button type="button" data-active={over ? "true" : "false"}>
                          Higher
                        </button>
                        <button type="button" data-active={!over ? "true" : "false"}>
                          Lower
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </article>
          ))}

          {!loading && lineups.length === 0 && (
            <div className="pick-card p-8">
              <p className="font-display text-2xl uppercase">No {sport} slips yet</p>
              <p className="mt-2 text-sm text-mute">
                Seed demo props from Picks, then run the optimizer.
              </p>
              <div className="mt-5">
                <PrimaryButton onClick={optimize}>Run optimizer</PrimaryButton>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

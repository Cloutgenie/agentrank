"use client";

import { useEffect, useState } from "react";
import { Nav } from "@/components/Nav";
import { EdgeBadge, GhostButton, PrimaryButton } from "@/components/ui";
import { client, pct, type Lineup } from "@/lib/api";

export default function LineupsPage() {
  const [platform, setPlatform] = useState<"prizepicks" | "underdog">("prizepicks");
  const [lineups, setLineups] = useState<Lineup[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadCached() {
    setError(null);
    try {
      const data = await client.lineups(platform);
      setLineups(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    }
  }

  useEffect(() => {
    loadCached();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [platform]);

  async function optimize() {
    setLoading(true);
    setError(null);
    try {
      const data = await client.optimize(platform, 5);
      setLineups(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Optimize failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="court-grid min-h-screen">
      <Nav active="/lineups" />
      <div className="mx-auto max-w-5xl px-6 pb-20 pt-4 md:px-10">
        <div className="animate-rise flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl tracking-tight md:text-5xl">Lineup Optimizer</h1>
            <p className="mt-2 max-w-xl text-ink/60">
              10k Monte Carlo sims per prop, PuLP integer program, max 3 from one team. Top 5 slips.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {(["prizepicks", "underdog"] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPlatform(p)}
                className={`rounded-md px-3 py-2 text-sm font-semibold capitalize ${
                  platform === p ? "bg-ink text-white" : "bg-white/70 text-ink/70"
                }`}
              >
                {p}
              </button>
            ))}
            <GhostButton onClick={optimize} disabled={loading}>
              {loading ? "Simulating…" : "Run optimizer"}
            </GhostButton>
          </div>
        </div>

        {error && (
          <p className="mt-8 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </p>
        )}

        <div className="mt-10 space-y-6">
          {lineups.map((lu) => (
            <article
              key={`${lu.platform}-${lu.rank}-${lu.expected_value}`}
              className="animate-rise-delay rounded-xl border border-ink/8 bg-white/80 p-5 backdrop-blur"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="font-display text-3xl">#{lu.rank}</span>
                  <EdgeBadge>{`EV ${(lu.expected_value * 100).toFixed(1)}%`}</EdgeBadge>
                  <EdgeBadge tone="ink">Win {pct(lu.win_prob, 2)}</EdgeBadge>
                </div>
                {lu.deep_link && <PrimaryButton href={lu.deep_link}>Open {platform}</PrimaryButton>}
              </div>
              <ul className="mt-4 divide-y divide-ink/8">
                {lu.picks.map((pick) => (
                  <li
                    key={`${pick.player_name}-${pick.stat_type}-${pick.side}`}
                    className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm"
                  >
                    <div>
                      <span className="font-semibold">{pick.player_name}</span>
                      {pick.team_abbr && (
                        <span className="ml-2 text-ink/45">{pick.team_abbr}</span>
                      )}
                      <p className="text-ink/55">
                        {pick.side.toUpperCase()} {pick.line} {pick.stat_type} · model{" "}
                        {pick.model_mean}
                      </p>
                    </div>
                    <EdgeBadge>{`Hit ${pct(pick.hit_prob)}`}</EdgeBadge>
                  </li>
                ))}
              </ul>
            </article>
          ))}

          {!loading && lineups.length === 0 && (
            <div className="rounded-xl border border-ink/10 bg-white/70 p-8">
              <p className="font-semibold">No lineups yet</p>
              <p className="mt-2 text-sm text-ink/60">
                Seed demo props from Game Picker, then run the optimizer.
              </p>
              <div className="mt-4">
                <PrimaryButton onClick={optimize}>Run optimizer</PrimaryButton>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Nav } from "@/components/Nav";
import { EdgeBadge, GhostButton, PrimaryButton } from "@/components/ui";
import { client, edgeLabel, pct, type GamePick } from "@/lib/api";

export default function PicksPage() {
  const [picks, setPicks] = useState<GamePick[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await client.gamePicks();
      setPicks(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load picks");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function seed() {
    setSeeding(true);
    try {
      await client.seedDemo();
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Seed failed");
    } finally {
      setSeeding(false);
    }
  }

  return (
    <main className="court-grid min-h-screen">
      <Nav active="/picks" />
      <div className="mx-auto max-w-5xl px-6 pb-20 pt-4 md:px-10">
        <div className="animate-rise flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl tracking-tight md:text-5xl">Game Picker</h1>
            <p className="mt-2 max-w-xl text-ink/60">
              Today&apos;s NBA slate ranked by model confidence versus market price. Only edges ≥ 2
              pp after vig are shown.
            </p>
          </div>
          <div className="flex gap-2">
            <GhostButton onClick={seed} disabled={seeding}>
              {seeding ? "Seeding…" : "Seed demo"}
            </GhostButton>
            <GhostButton onClick={load}>Refresh</GhostButton>
          </div>
        </div>

        {loading && <p className="mt-10 text-ink/50">Loading slate…</p>}
        {error && (
          <p className="mt-10 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}. Is the API running on :8000?
          </p>
        )}

        {!loading && !error && picks.length === 0 && (
          <div className="mt-12 rounded-xl border border-ink/10 bg-white/70 p-8">
            <p className="font-semibold">No edged picks yet</p>
            <p className="mt-2 text-sm text-ink/60">
              Seed the demo slate or run the ingest pipeline with API keys.
            </p>
            <div className="mt-4">
              <PrimaryButton onClick={seed}>Seed demo slate</PrimaryButton>
            </div>
          </div>
        )}

        <div className="mt-10 space-y-3">
          {picks.map((p, i) => (
            <article
              key={`${p.game_id}-${p.pick_team}`}
              className="animate-rise group grid gap-4 rounded-xl border border-ink/8 bg-white/75 px-5 py-4 backdrop-blur transition hover:border-edge/40 hover:shadow-glow md:grid-cols-[1fr_auto_auto] md:items-center"
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-display text-2xl tracking-wide">
                    {p.away_team} @ {p.home_team}
                  </span>
                  <EdgeBadge>{edgeLabel(p.edge_pp)}</EdgeBadge>
                  <EdgeBadge tone="ink">Pick {p.pick_team}</EdgeBadge>
                </div>
                <p className="mt-1 text-sm text-ink/55">
                  Model {pct(p.model_prob)} · Market {pct(p.market_prob)} · Elo {pct(p.elo_prob)} ·{" "}
                  {new Date(p.commence_time).toLocaleString()}
                </p>
              </div>
              <div className="text-sm text-ink/60">
                Confidence <span className="font-semibold text-ink">{pct(p.confidence, 0)}</span>
              </div>
              {p.deep_link && (
                <PrimaryButton href={p.deep_link}>Open on Robinhood</PrimaryButton>
              )}
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}

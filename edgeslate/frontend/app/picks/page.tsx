"use client";

import { useEffect, useState } from "react";
import { Nav } from "@/components/Nav";
import { SportSwitcher } from "@/components/SportSwitcher";
import { EdgePill, GhostButton, PrimaryButton } from "@/components/ui";
import { client, edgeLabel, pct, type GamePick, type SportId } from "@/lib/api";

export default function PicksPage() {
  const [sport, setSport] = useState<SportId>("NFL");
  const [picks, setPicks] = useState<GamePick[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

  async function load(nextSport: SportId = sport) {
    setLoading(true);
    setError(null);
    try {
      setPicks(await client.gamePicks(nextSport));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load picks");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(sport);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sport]);

  async function seed() {
    setSeeding(true);
    try {
      await client.seedDemo(sport);
      await load(sport);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Seed failed");
    } finally {
      setSeeding(false);
    }
  }

  return (
    <main className="min-h-screen">
      <Nav active="/picks" />
      <div className="mx-auto max-w-3xl px-4 pb-24 pt-6 md:px-8">
        <div className="animate-rise flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-lime">Game board</p>
            <h1 className="mt-1 font-display text-4xl uppercase tracking-tight md:text-5xl">
              Today&apos;s picks
            </h1>
            <p className="mt-2 max-w-md text-sm text-mute">
              NFL, College Football, and NBA — only slips where model beats market by 2+ pp after vig.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <SportSwitcher
              value={sport}
              onChange={(s) => {
                setSport(s);
              }}
            />
            <GhostButton onClick={seed} disabled={seeding}>
              {seeding ? "Seeding…" : "Seed demo"}
            </GhostButton>
            <GhostButton onClick={() => load(sport)}>Refresh</GhostButton>
          </div>
        </div>

        {loading && <p className="mt-10 text-mute">Loading {sport} board…</p>}
        {error && (
          <p className="mt-8 rounded-2xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
            {error}. Is the API on :8000?
          </p>
        )}

        {!loading && !error && picks.length === 0 && (
          <div className="pick-card mt-10 p-8">
            <p className="font-display text-2xl uppercase">No edged {sport} picks</p>
            <p className="mt-2 text-sm text-mute">Seed the demo slate or run ingest with API keys.</p>
            <div className="mt-5">
              <PrimaryButton onClick={seed}>Seed {sport} demo</PrimaryButton>
            </div>
          </div>
        )}

        <div className="mt-8 space-y-4">
          {picks.map((p, i) => (
            <article
              key={`${p.game_id}-${p.pick_team}`}
              className="pick-card animate-rise p-5"
              style={{ animationDelay: `${i * 0.04}s` }}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <EdgePill>{edgeLabel(p.edge_pp)} edge</EdgePill>
                    <EdgePill tone="mute">Pick {p.pick_team}</EdgePill>
                    <EdgePill tone="mute">{p.sport || sport}</EdgePill>
                  </div>
                  <h2 className="mt-3 font-display text-3xl uppercase tracking-tight">
                    {p.away_team} <span className="text-mute">@</span> {p.home_team}
                  </h2>
                  <p className="mt-1 text-xs text-mute">
                    {new Date(p.commence_time).toLocaleString()} · conf {pct(p.confidence, 0)}
                  </p>
                </div>
                <div className="rounded-2xl bg-lime px-3 py-2 text-center text-void">
                  <p className="text-[10px] font-bold uppercase">Model</p>
                  <p className="font-display text-2xl leading-none">{pct(p.model_prob, 0)}</p>
                </div>
              </div>

              <div className="side-toggle mt-5">
                <button type="button" data-active={p.pick_side === "away" ? "true" : "false"}>
                  {p.away_team}{" "}
                  {pct(p.pick_side === "away" ? p.model_prob : 1 - p.model_prob, 0)}
                </button>
                <button type="button" data-active={p.pick_side === "home" ? "true" : "false"}>
                  {p.home_team}{" "}
                  {pct(p.pick_side === "home" ? p.model_prob : 1 - p.model_prob, 0)}
                </button>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
                <div className="rounded-xl bg-void px-2 py-3">
                  <p className="text-mute">Market</p>
                  <p className="mt-1 font-bold">{pct(p.market_prob)}</p>
                </div>
                <div className="rounded-xl bg-void px-2 py-3">
                  <p className="text-mute">Elo</p>
                  <p className="mt-1 font-bold">{pct(p.elo_prob)}</p>
                </div>
                <div className="rounded-xl bg-void px-2 py-3">
                  <p className="text-mute">Edge</p>
                  <p className="mt-1 font-bold text-lime">{edgeLabel(p.edge_pp)} pp</p>
                </div>
              </div>

              {p.deep_link && (
                <PrimaryButton href={p.deep_link} className="mt-5 w-full">
                  Open pick
                </PrimaryButton>
              )}
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}

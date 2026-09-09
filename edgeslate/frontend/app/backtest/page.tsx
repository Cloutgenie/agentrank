"use client";

import { useEffect, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Nav } from "@/components/Nav";
import { EdgePill, GhostButton } from "@/components/ui";
import { client, pct, type BacktestSummary } from "@/lib/api";

export default function BacktestPage() {
  const [data, setData] = useState<BacktestSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setError(null);
    try {
      setData(await client.backtest());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load backtest");
    }
  }

  useEffect(() => {
    load();
  }, []);

  const chart =
    data?.calibration.map((c) => ({
      bucket: c.bucket,
      predicted: Number((c.predicted * 100).toFixed(1)),
      actual: Number((c.actual * 100).toFixed(1)),
      count: c.count,
    })) || [];

  return (
    <main className="min-h-screen">
      <Nav active="/backtest" />
      <div className="mx-auto max-w-5xl px-4 pb-24 pt-6 md:px-8">
        <div className="animate-rise flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-lime">Calibration</p>
            <h1 className="mt-1 font-display text-4xl uppercase tracking-tight md:text-5xl">
              Backtest
            </h1>
            <p className="mt-2 max-w-xl text-sm text-mute">
              Grade historical picks vs closers. Launch gate: positive EV over 500+ graded picks.
            </p>
          </div>
          <GhostButton onClick={load}>Refresh</GhostButton>
        </div>

        {error && (
          <p className="mt-8 rounded-2xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
            {error}
          </p>
        )}

        {data && (
          <>
            <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ["Graded", String(data.graded_picks)],
                ["Win rate", pct(data.win_rate)],
                ["Avg edge", `+${data.avg_edge_pp.toFixed(1)} pp`],
                ["Launch", data.launch_ready ? "Ready" : "Hold"],
              ].map(([label, value]) => (
                <div key={label} className="pick-card px-4 py-4">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-mute">{label}</p>
                  <p className="mt-1 font-display text-3xl uppercase text-mist">{value}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <EdgePill tone={data.positive_ev ? "lime" : "warn"}>
                {data.positive_ev ? "Positive EV" : "EV not confirmed"}
              </EdgePill>
              <EdgePill tone="mute">{data.notes}</EdgePill>
            </div>

            <section className="pick-card mt-10 animate-rise-2 p-5">
              <h2 className="font-display text-2xl uppercase tracking-wide">Calibration curve</h2>
              <p className="mt-1 text-sm text-mute">
                When we say 60%, do we win ~60%? Predicted vs realized.
              </p>
              <div className="mt-6 h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                    <XAxis dataKey="bucket" tick={{ fill: "#8A8A8A", fontSize: 12 }} />
                    <YAxis domain={[45, 85]} tick={{ fill: "#8A8A8A", fontSize: 12 }} unit="%" />
                    <Tooltip
                      contentStyle={{
                        background: "#1A1A1A",
                        border: "1px solid #2A2A2A",
                        borderRadius: 12,
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="predicted"
                      name="Model said"
                      stroke="#E8E8E8"
                      strokeWidth={2}
                      dot
                    />
                    <Line
                      type="monotone"
                      dataKey="actual"
                      name="Actually won"
                      stroke="#C8FF00"
                      strokeWidth={2}
                      dot
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}

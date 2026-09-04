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
import { EdgeBadge, GhostButton } from "@/components/ui";
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
    <main className="court-grid min-h-screen">
      <Nav active="/backtest" />
      <div className="mx-auto max-w-5xl px-6 pb-20 pt-4 md:px-10">
        <div className="animate-rise flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl tracking-tight md:text-5xl">Backtest</h1>
            <p className="mt-2 max-w-xl text-ink/60">
              Grade historical picks against closing lines. Launch gate: positive EV over 500+ graded
              picks.
            </p>
          </div>
          <GhostButton onClick={load}>Refresh</GhostButton>
        </div>

        {error && (
          <p className="mt-8 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
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
                ["Launch ready", data.launch_ready ? "Yes" : "Not yet"],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-xl border border-ink/8 bg-white/75 px-4 py-4"
                >
                  <p className="text-xs uppercase tracking-wider text-ink/45">{label}</p>
                  <p className="mt-1 font-display text-3xl">{value}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <EdgeBadge tone={data.positive_ev ? "edge" : "warn"}>
                {data.positive_ev ? "Positive EV" : "EV not confirmed"}
              </EdgeBadge>
              <EdgeBadge tone="ink">{data.notes}</EdgeBadge>
            </div>

            <section className="mt-10 animate-rise-delay rounded-xl border border-ink/8 bg-white/80 p-5">
              <h2 className="font-display text-2xl tracking-wide">Calibration curve</h2>
              <p className="mt-1 text-sm text-ink/55">
                When we say 60%, do we win ~60%? Predicted vs realized.
              </p>
              <div className="mt-6 h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(11,18,32,0.08)" />
                    <XAxis dataKey="bucket" tick={{ fontSize: 12 }} />
                    <YAxis domain={[45, 85]} tick={{ fontSize: 12 }} unit="%" />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="predicted"
                      name="Model said"
                      stroke="#0B1220"
                      strokeWidth={2}
                      dot
                    />
                    <Line
                      type="monotone"
                      dataKey="actual"
                      name="Actually won"
                      stroke="#12B886"
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

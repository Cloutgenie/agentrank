"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import type { DeskPlay, RiskLimits } from "@/lib/desk";

interface ScanResponse {
  primary: DeskPlay | null;
  plays: DeskPlay[];
  refusedMessage?: string;
  risk: RiskLimits;
  generatedAt: string;
}

export default function DeskAppPage() {
  const [data, setData] = useState<ScanResponse | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [equity, setEquity] = useState(100_000);

  const scan = useCallback(() => {
    startTransition(async () => {
      setError(null);
      try {
        const res = await fetch("/api/desk/scan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            accountEquity: equity,
            riskPerTrade: 0.015,
            dailyLossLimit: 0.03,
            dayPnl: 0,
          }),
        });
        if (!res.ok) throw new Error(await res.text());
        const json = (await res.json()) as ScanResponse;
        setData(json);
        setSelectedId(json.primary?.id ?? json.plays[0]?.id ?? null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Scan failed");
      }
    });
  }, [equity]);

  useEffect(() => {
    scan();
  }, [scan]);

  const selected =
    data?.plays.find((p) => p.id === selectedId) ?? data?.primary ?? null;

  const dailyCap = equity * 0.03;

  return (
    <main className="mx-auto max-w-[1100px] px-6 pb-20 pt-4">
      <div className="desk-animate-in flex flex-wrap items-end justify-between gap-4 border-b border-[var(--desk-line)] pb-6">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-[var(--desk-muted)]">
            <span className="desk-live-dot" />
            Market scan
          </div>
          <h1 className="desk-display text-4xl font-bold tracking-tight md:text-5xl">Today’s play</h1>
          <p className="mt-2 max-w-lg text-sm text-[var(--desk-muted)]">
            The desk scans, ranks, and decides. You pick one ticket — entry, TP, SL.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-xs text-[var(--desk-muted)]">
            Account
            <input
              type="number"
              className="desk-mono ml-2 w-28 rounded-md border border-[var(--desk-line)] bg-white/70 px-2 py-1.5 text-sm text-[var(--desk-ink)]"
              value={equity}
              min={5000}
              step={1000}
              onChange={(e) => setEquity(Number(e.target.value) || 50_000)}
            />
          </label>
          <button
            type="button"
            onClick={scan}
            disabled={isPending}
            className={`rounded-full bg-[var(--desk-ink)] px-5 py-2 text-sm font-semibold text-[#f3f5f0] transition hover:opacity-90 disabled:opacity-60 ${
              isPending ? "desk-scan-bar" : ""
            }`}
          >
            {isPending ? "Scanning…" : "Scan again"}
          </button>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-xs text-[var(--desk-muted)]">
        <span>
          Daily loss limit{" "}
          <span className="desk-mono text-[var(--desk-ink)]">${dailyCap.toFixed(0)}</span> (3%)
        </span>
        {data?.generatedAt && (
          <span className="desk-mono">Updated {new Date(data.generatedAt).toLocaleTimeString()}</span>
        )}
      </div>

      {error && (
        <p className="mt-6 rounded-md bg-[var(--desk-stop-soft)] px-4 py-3 text-sm text-[var(--desk-stop)]">
          {error}
        </p>
      )}

      {!data && !error && (
        <p className="mt-16 text-center text-[var(--desk-muted)]">Running rules engine…</p>
      )}

      {data && !selected && (
        <div className="mt-16 max-w-lg border border-[var(--desk-line)] bg-[var(--desk-panel)] p-8">
          <p className="desk-display text-2xl font-bold">No trade</p>
          <p className="mt-3 text-[var(--desk-muted)]">
            {data.refusedMessage ?? "Regime refused premium sales. Sit on hands."}
          </p>
        </div>
      )}

      {data && data.plays.length > 0 && (
        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_1.35fr]">
          <aside className="desk-animate-in-delay space-y-3">
            <p className="text-xs uppercase tracking-[0.16em] text-[var(--desk-muted)]">
              Pick one
            </p>
            {data.plays.map((play) => {
              const active = play.id === selected?.id;
              return (
                <button
                  key={play.id}
                  type="button"
                  onClick={() => setSelectedId(play.id)}
                  className={`w-full border px-4 py-4 text-left transition ${
                    active
                      ? "border-[var(--desk-ink)] bg-white"
                      : "border-[var(--desk-line)] bg-[var(--desk-panel)] hover:border-[var(--desk-ink)]/40"
                  }`}
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="desk-display text-lg font-bold">{play.symbol}</span>
                    <span className="desk-mono text-xs text-[var(--desk-muted)]">#{play.rank}</span>
                  </div>
                  <p className="mt-1 text-sm text-[var(--desk-muted)]">{play.title}</p>
                  <p className="desk-mono mt-2 text-xs text-[var(--desk-signal)]">
                    Entry ${play.ticket.entry.toFixed(2)} · TP ${play.ticket.takeProfit.toFixed(2)} ·
                    SL ${play.ticket.stopLoss.toFixed(2)}
                  </p>
                </button>
              );
            })}
          </aside>

          {selected && <TicketDetail play={selected} />}
        </div>
      )}
    </main>
  );
}

function TicketDetail({ play }: { play: DeskPlay }) {
  return (
    <article className="desk-animate-in-delay-2 border border-[var(--desk-line)] bg-white/80 p-6 md:p-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-[var(--desk-muted)]">
            Desk ticket · {play.asOf}
          </p>
          <h2 className="desk-display mt-2 text-3xl font-bold tracking-tight md:text-4xl">
            {play.symbol}
          </h2>
          <p className="mt-1 text-sm text-[var(--desk-muted)]">{play.title}</p>
        </div>
        <span className="rounded-full bg-[var(--desk-amber-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[var(--desk-amber)]">
          {play.regime.regime.replace("_", " ")}
        </span>
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        <BigStat
          label="Buy / sell to open"
          value={`$${play.ticket.entry.toFixed(2)}`}
          hint={`${play.ticket.contracts} contracts · credit`}
          tone="signal"
        />
        <BigStat
          label="Take profit"
          value={`$${play.ticket.takeProfit.toFixed(2)}`}
          hint="50% of credit"
          tone="signal"
        />
        <BigStat
          label="Stop loss"
          value={`$${play.ticket.stopLoss.toFixed(2)}`}
          hint="2× credit"
          tone="stop"
        />
      </div>

      <div className="mt-6 flex flex-wrap gap-6 border-y border-[var(--desk-line)] py-5 text-sm">
        <Meta label="Exit by" value={play.ticket.exitBy} />
        <Meta label="Max loss" value={`$${play.ticket.maxLoss.toFixed(0)}`} />
        <Meta label="Width" value={`${play.structure.width} pts`} />
        <Meta label="Risk" value={`${play.size.riskPct}% of account`} />
      </div>

      <p className="desk-mono mt-6 text-sm leading-relaxed text-[var(--desk-ink)]">
        {play.ticket.summary}
      </p>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <InfoBlock title="Why this structure" body={play.plan.reason} />
        <InfoBlock title="Regime notes" body={play.regime.reasons.join(" · ")} />
      </div>

      <div className="mt-6">
        <p className="mb-2 text-xs uppercase tracking-[0.16em] text-[var(--desk-muted)]">Legs</p>
        <ul className="space-y-2">
          {play.structure.legs.map((leg) => (
            <li
              key={`${leg.side}-${leg.right}-${leg.strike}`}
              className="desk-mono flex justify-between border border-[var(--desk-line)] bg-[var(--desk-panel-solid)] px-3 py-2 text-sm"
            >
              <span>
                {leg.side.toUpperCase()} {leg.right}
                {leg.strike}
              </span>
              <span className="text-[var(--desk-muted)]">
                {leg.bid.toFixed(2)} × {leg.ask.toFixed(2)}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <ol className="mt-8 space-y-2 text-sm text-[var(--desk-muted)]">
        {play.exits.notes.map((n) => (
          <li key={n} className="flex gap-2">
            <span className="text-[var(--desk-signal)]">→</span>
            {n}
          </li>
        ))}
      </ol>
    </article>
  );
}

function BigStat({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint: string;
  tone: "signal" | "stop";
}) {
  const bg = tone === "signal" ? "var(--desk-signal-soft)" : "var(--desk-stop-soft)";
  const fg = tone === "signal" ? "var(--desk-signal)" : "var(--desk-stop)";
  return (
    <div className="rounded-lg p-4" style={{ background: bg }}>
      <p className="text-[10px] uppercase tracking-[0.16em]" style={{ color: fg }}>
        {label}
      </p>
      <p className="desk-mono mt-2 text-3xl font-semibold tracking-tight" style={{ color: fg }}>
        {value}
      </p>
      <p className="mt-1 text-xs" style={{ color: fg, opacity: 0.8 }}>
        {hint}
      </p>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.16em] text-[var(--desk-muted)]">{label}</p>
      <p className="desk-mono mt-1 font-medium text-[var(--desk-ink)]">{value}</p>
    </div>
  );
}

function InfoBlock({ title, body }: { title: string; body: string }) {
  return (
    <div className="border border-[var(--desk-line)] bg-[var(--desk-panel-solid)] p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--desk-muted)]">
        {title}
      </p>
      <p className="mt-2 text-sm leading-relaxed text-[var(--desk-ink)]">{body}</p>
    </div>
  );
}

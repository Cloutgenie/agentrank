"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import type { DeskPlay } from "@/lib/desk";

interface Wire {
  headlines: string[];
  putCallRatio: number;
  flowBias: string;
  headlineScore: number;
  events: { code: string; label: string; impact: string; minutesUntil: number }[];
}

interface ScanResponse {
  primary: DeskPlay | null;
  plays: DeskPlay[];
  refusedMessage?: string;
  wire?: Wire;
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
            riskPerTrade: 0.01,
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
    <main>
      <div className="rz-ticker">
        <div className="rz-ticker-live">
          <span className="rz-dot" />
          Desk
        </div>
        <div className="rz-ticker-track">
          {(data?.wire?.headlines?.length
            ? data.wire.headlines
            : ["Scanning regime · GEX · news · sentiment"]
          )
            .concat(data?.wire?.headlines ?? [])
            .map((h, i) => (
              <span key={`${h}-${i}`} className="rz-ticker-item">
                <span className="sym">WIRE</span>
                <span>{h}</span>
              </span>
            ))}
        </div>
      </div>

      <div className="rz-section">
        <div className="rz-fade flex flex-wrap items-end justify-between gap-4 border-b-4 border-[var(--rz-red)] pb-5">
          <div>
            <p className="rz-kicker !mb-2">Market scan</p>
            <h1 className="desk-display text-4xl font-bold md:text-5xl">Today’s play</h1>
            <p className="mt-2 max-w-lg text-sm text-[var(--rz-muted)]">
              The desk scans and decides. You pick one ticket — entry, TP, SL.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <label className="text-xs font-bold uppercase tracking-wide text-[var(--rz-muted)]">
              Account
              <input
                type="number"
                className="desk-mono ml-2 w-28 border border-[var(--rz-line)] bg-white px-2 py-1.5 text-sm text-[var(--rz-ink)]"
                value={equity}
                min={5000}
                step={1000}
                onChange={(e) => setEquity(Number(e.target.value) || 100_000)}
              />
            </label>
            <button type="button" onClick={scan} disabled={isPending} className="rz-btn">
              {isPending ? "Scanning…" : "Scan again"}
            </button>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--rz-muted)]">
          <span>
            Daily hard stop{" "}
            <span className="desk-mono font-bold text-[var(--rz-ink)]">${dailyCap.toFixed(0)}</span>{" "}
            (3%)
            {data?.wire && (
              <>
                {" "}
                · P/C{" "}
                <span className="desk-mono text-[var(--rz-ink)]">
                  {data.wire.putCallRatio.toFixed(2)}
                </span>{" "}
                · flow {data.wire.flowBias}
              </>
            )}
          </span>
          {data?.generatedAt && (
            <span className="desk-mono">
              Updated {new Date(data.generatedAt).toLocaleTimeString()}
            </span>
          )}
        </div>

        {error && (
          <p className="mt-6 bg-[var(--rz-stop-soft)] px-4 py-3 text-sm text-[var(--rz-stop)]">
            {error}
          </p>
        )}

        {!data && !error && (
          <p className="mt-16 text-center text-[var(--rz-muted)]">Running rules engine…</p>
        )}

        {data && !selected && (
          <div className="rz-card mt-10 max-w-lg">
            <div className="rz-card-head">
              <span>No trade</span>
              <span className="rz-badge">Sit</span>
            </div>
            <div className="p-6">
              <p className="desk-display text-2xl font-bold">Hands off</p>
              <p className="mt-3 text-[var(--rz-muted)]">
                {data.refusedMessage ?? "Regime refused premium sales."}
              </p>
            </div>
          </div>
        )}

        {data && data.plays.length > 0 && (
          <div className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.35fr]">
            <aside className="rz-fade-delay space-y-3">
              <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[var(--rz-muted)]">
                Pick one
              </p>
              {data.plays.map((play) => {
                const active = play.id === selected?.id;
                return (
                  <button
                    key={play.id}
                    type="button"
                    onClick={() => setSelectedId(play.id)}
                    className={`rz-play-row ${active ? "active" : ""}`}
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="desk-display text-xl font-bold">{play.symbol}</span>
                      <span className="desk-mono text-xs text-[var(--rz-muted)]">#{play.rank}</span>
                    </div>
                    <p className="mt-1 text-sm text-[var(--rz-muted)]">{play.title}</p>
                    <p className="desk-mono mt-2 text-xs font-semibold text-[var(--rz-green)]">
                      Entry ${play.ticket.entry.toFixed(2)} · TP ${play.ticket.takeProfit.toFixed(2)}{" "}
                      · SL ${play.ticket.stopLoss.toFixed(2)}
                    </p>
                  </button>
                );
              })}

              {data.wire && (
                <div className="rz-card mt-6">
                  <div className="rz-card-head">
                    <span>Wire</span>
                    <span>Score {data.wire.headlineScore.toFixed(2)}</span>
                  </div>
                  {data.wire.headlines.slice(0, 3).map((h) => (
                    <div key={h} className="rz-wire-item text-sm">
                      {h}
                    </div>
                  ))}
                </div>
              )}
            </aside>

            {selected && <TicketDetail play={selected} />}
          </div>
        )}
      </div>
    </main>
  );
}

function TicketDetail({ play }: { play: DeskPlay }) {
  return (
    <article className="rz-box rz-fade-delay">
      <div className="rz-box-head">
        <span>
          Ticket · {play.asOf}
        </span>
        <span className="rz-badge">{play.regime.regime.replace("_", " ")}</span>
      </div>
      <div className="rz-box-body !p-6 md:!p-8">
        <h2 className="desk-display text-4xl font-bold tracking-tight">{play.symbol}</h2>
        <p className="mt-1 text-sm text-[var(--rz-muted)]">{play.title}</p>

        <div className="rz-box-grid mt-6 !gap-2">
          <div className="rz-stat entry">
            <div className="rz-stat-label">Sell to open</div>
            <div className="rz-stat-value">${play.ticket.entry.toFixed(2)}</div>
            <p className="mt-1 text-[10px] text-[var(--rz-muted)]">
              {play.ticket.contracts} contracts
            </p>
          </div>
          <div className="rz-stat tp">
            <div className="rz-stat-label">Take profit</div>
            <div className="rz-stat-value">${play.ticket.takeProfit.toFixed(2)}</div>
            <p className="mt-1 text-[10px] text-[var(--rz-muted)]">50% of credit</p>
          </div>
          <div className="rz-stat sl">
            <div className="rz-stat-label">Stop loss</div>
            <div className="rz-stat-value">${play.ticket.stopLoss.toFixed(2)}</div>
            <p className="mt-1 text-[10px] text-[var(--rz-muted)]">2× credit</p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-6 border-y border-[var(--rz-line)] py-4 text-sm">
          <Meta label="Exit by" value={play.ticket.exitBy} />
          <Meta label="Max loss" value={`$${play.ticket.maxLoss.toFixed(0)}`} />
          <Meta label="Width" value={`${play.structure.width} pts`} />
          <Meta label="Risk" value={`${play.size.riskPct}%`} />
        </div>

        <p className="desk-mono mt-5 text-sm leading-relaxed text-[var(--rz-ink)]">
          {play.ticket.summary}
        </p>

        <div className="mt-6 grid gap-3 md:grid-cols-2">
          <Info title="Why this structure" body={play.plan.reason} />
          <Info title="Regime" body={play.regime.reasons.join(" · ")} />
        </div>

        {(play.regime.sentimentNotes?.length ?? 0) > 0 && (
          <div className="mt-3">
            <Info title="Sentiment / news" body={play.regime.sentimentNotes!.join(" · ")} />
          </div>
        )}

        <div className="mt-6">
          <p className="mb-2 text-[10px] font-extrabold uppercase tracking-[0.14em] text-[var(--rz-muted)]">
            Legs
          </p>
          <ul className="space-y-2">
            {play.structure.legs.map((leg) => (
              <li
                key={`${leg.side}-${leg.right}-${leg.strike}`}
                className="desk-mono flex justify-between border border-[var(--rz-line)] bg-[var(--rz-off)] px-3 py-2 text-sm"
              >
                <span>
                  {leg.side.toUpperCase()} {leg.right}
                  {leg.strike}
                </span>
                <span className="text-[var(--rz-muted)]">
                  {leg.bid.toFixed(2)} × {leg.ask.toFixed(2)}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <ol className="mt-6 space-y-2 text-sm text-[var(--rz-muted)]">
          {play.exits.notes.map((n) => (
            <li key={n} className="flex gap-2">
              <span className="font-bold text-[var(--rz-red)]">→</span>
              {n}
            </li>
          ))}
        </ol>
      </div>
    </article>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[var(--rz-muted)]">
        {label}
      </p>
      <p className="desk-mono mt-1 font-semibold text-[var(--rz-ink)]">{value}</p>
    </div>
  );
}

function Info({ title, body }: { title: string; body: string }) {
  return (
    <div className="border border-[var(--rz-line)] bg-[var(--rz-off)] p-4">
      <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[var(--rz-muted)]">
        {title}
      </p>
      <p className="mt-2 text-sm leading-relaxed text-[var(--rz-ink)]">{body}</p>
    </div>
  );
}

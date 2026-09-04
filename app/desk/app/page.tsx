"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import type { DeskPlay } from "@/lib/desk";
import { DEFAULT_STARTING_MONEY } from "@/lib/desk";

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
  startingMoney?: number;
  generatedAt: string;
}

export default function DeskAppPage() {
  const [startingMoney, setStartingMoney] = useState(DEFAULT_STARTING_MONEY);
  const [draftMoney, setDraftMoney] = useState(String(DEFAULT_STARTING_MONEY));
  const [data, setData] = useState<ScanResponse | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const findPlay = useCallback(
    (money = startingMoney) => {
      startTransition(async () => {
        setError(null);
        try {
          const res = await fetch("/api/desk/scan", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ startingMoney: money }),
          });
          if (!res.ok) throw new Error(await res.text());
          const json = (await res.json()) as ScanResponse;
          setData(json);
          setSelectedId(json.primary?.id ?? json.plays[0]?.id ?? null);
        } catch (e) {
          setError(e instanceof Error ? e.message : "Scan failed");
        }
      });
    },
    [startingMoney]
  );

  useEffect(() => {
    findPlay(startingMoney);
  }, [findPlay, startingMoney]);

  const selected =
    data?.plays.find((p) => p.id === selectedId) ?? data?.primary ?? null;

  const applyMoney = () => {
    const n = Math.max(25, Number(draftMoney) || DEFAULT_STARTING_MONEY);
    setDraftMoney(String(n));
    setStartingMoney(n);
  };

  return (
    <main>
      <div className="rz-ticker">
        <div className="rz-ticker-live">
          <span className="rz-dot" />
          Live
        </div>
        <div className="rz-ticker-track">
          {(data?.wire?.headlines?.length
            ? data.wire.headlines
            : ["Enter starting money · desk finds the play"]
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
        <div className="rz-fade border-b-4 border-[var(--rz-red)] pb-6">
          <p className="rz-kicker !mb-2">Find the play</p>
          <h1 className="desk-display text-4xl font-bold md:text-5xl">Starting money</h1>
          <p className="mt-2 max-w-xl text-sm text-[var(--rz-muted)]">
            Put in what you want to start with. The desk scans the market and sizes{" "}
            <strong className="text-[var(--rz-ink)]">one play</strong> to that bankroll — entry,
            take profit, stop.
          </p>

          <form
            className="mt-6 flex flex-wrap items-end gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              applyMoney();
            }}
          >
            <label className="text-xs font-extrabold uppercase tracking-wide text-[var(--rz-muted)]">
              Start with
              <div className="mt-1 flex items-center border-2 border-[var(--rz-ink)] bg-white">
                <span className="desk-mono px-3 text-lg font-bold text-[var(--rz-muted)]">$</span>
                <input
                  type="number"
                  min={25}
                  step={25}
                  className="desk-mono w-28 border-0 py-2.5 pr-3 text-lg font-bold text-[var(--rz-ink)] outline-none"
                  value={draftMoney}
                  onChange={(e) => setDraftMoney(e.target.value)}
                  aria-label="Starting money"
                />
              </div>
            </label>
            <button type="submit" disabled={isPending} className="rz-btn">
              {isPending ? "Finding…" : "Find my play"}
            </button>
            <p className="w-full text-xs text-[var(--rz-muted)] md:w-auto md:pb-2">
              Example: <button type="button" className="font-bold text-[var(--rz-red)] underline" onClick={() => { setDraftMoney("100"); setStartingMoney(100); }}> $100</button>
              {" · "}
              <button type="button" className="font-bold text-[var(--rz-red)] underline" onClick={() => { setDraftMoney("500"); setStartingMoney(500); }}>$500</button>
              {" · "}
              <button type="button" className="font-bold text-[var(--rz-red)] underline" onClick={() => { setDraftMoney("1000"); setStartingMoney(1000); }}>$1,000</button>
            </p>
          </form>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--rz-muted)]">
          <span>
            Bankroll{" "}
            <span className="desk-mono font-bold text-[var(--rz-ink)]">${startingMoney}</span>
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
          <p className="mt-16 text-center text-[var(--rz-muted)]">Finding today’s play…</p>
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
                {data.refusedMessage ?? "Regime refused. Keep your money."}
              </p>
            </div>
          </div>
        )}

        {data && selected && (
          <div className="mt-8 grid gap-6 lg:grid-cols-[0.85fr_1.4fr]">
            {data.plays.length > 1 && (
              <aside className="rz-fade-delay space-y-3">
                <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[var(--rz-muted)]">
                  Pick one
                </p>
                {data.plays.map((play) => {
                  const active = play.id === selected.id;
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
                        Buy ${play.ticket.entry.toFixed(2)} · TP ${play.ticket.takeProfit.toFixed(2)} ·
                        SL ${play.ticket.stopLoss.toFixed(2)}
                      </p>
                    </button>
                  );
                })}
              </aside>
            )}

            <TicketDetail play={selected} startingMoney={startingMoney} />
          </div>
        )}
      </div>
    </main>
  );
}

function TicketDetail({
  play,
  startingMoney,
}: {
  play: DeskPlay;
  startingMoney: number;
}) {
  return (
    <article className="rz-box rz-fade-delay">
      <div className="rz-box-head">
        <span>
          Your play · ${startingMoney} start · {play.asOf}
        </span>
        <span className="rz-badge">{play.regime.regime.replace("_", " ")}</span>
      </div>
      <div className="rz-box-body !p-6 md:!p-8">
        <h2 className="desk-display text-4xl font-bold tracking-tight">{play.symbol}</h2>
        <p className="mt-1 text-sm text-[var(--rz-muted)]">{play.title}</p>

        <div className="rz-box-grid mt-6 !gap-2">
          <div className="rz-stat entry">
            <div className="rz-stat-label">Buy / sell here</div>
            <div className="rz-stat-value">${play.ticket.entry.toFixed(2)}</div>
            <p className="mt-1 text-[10px] text-[var(--rz-muted)]">
              {play.ticket.contracts} contract{play.ticket.contracts === 1 ? "" : "s"}
            </p>
          </div>
          <div className="rz-stat tp">
            <div className="rz-stat-label">Take profit</div>
            <div className="rz-stat-value">${play.ticket.takeProfit.toFixed(2)}</div>
            <p className="mt-1 text-[10px] text-[var(--rz-muted)]">Sell here</p>
          </div>
          <div className="rz-stat sl">
            <div className="rz-stat-label">Stop loss</div>
            <div className="rz-stat-value">${play.ticket.stopLoss.toFixed(2)}</div>
            <p className="mt-1 text-[10px] text-[var(--rz-muted)]">Cut here</p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-6 border-y border-[var(--rz-line)] py-4 text-sm">
          <Meta label="Exit by" value={play.ticket.exitBy} />
          <Meta label="Max loss" value={`$${play.ticket.maxLoss.toFixed(0)}`} />
          <Meta label="Contracts" value={String(play.ticket.contracts)} />
          <Meta label="Of bankroll" value={`${play.size.riskPct}%`} />
        </div>

        <p className="desk-mono mt-5 text-sm leading-relaxed text-[var(--rz-ink)]">
          {play.ticket.summary}
        </p>

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

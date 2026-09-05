export const dynamic = "force-dynamic";

import Link from "next/link";
import { BRAND, SETTINGS, scanForPlays } from "@/lib/desk";

export default async function DeskLandingPage() {
  const { primary, wire, feed, liveDataExplainer , feedError} = await scanForPlays();
  const tickerItems = [
    ...(wire?.headlines ?? []).map((h) => ({ sym: "WIRE", text: h })),
    { sym: "FEED", text: feed?.message ?? feedError ?? "Live tape required" },
    {
      sym: "PLAY",
      text: "Only Call or Put — Buy · Take profit · Stop",
    },
    {
      sym: "START",
      text: "Enter starting money · desk finds one play (try $100)",
    },
    {
      sym: "EXIT",
      text: `+${(SETTINGS.takeProfitPct * 100).toFixed(0)}% TP · −${(SETTINGS.stopLossPct * 100).toFixed(0)}% SL · flat by ${SETTINGS.timeExitEt}`,
    },
  ];

  return (
    <main>
      <div className="rz-ticker" aria-label="Market wire">
        <div className={`rz-ticker-live ${feed?.mode === "live" ? "" : "rz-ticker-demo"}`}>
          <span className="rz-dot" />
          {feed?.mode === "live" ? "Live" : "Offline"}
        </div>
        <div className="rz-ticker-track">
          {[...tickerItems, ...tickerItems].map((item, i) => (
            <span key={`${item.sym}-${i}`} className="rz-ticker-item">
              <span className="sym">{item.sym}</span>
              <span>{item.text}</span>
            </span>
          ))}
        </div>
      </div>

      <section className="rz-hero">
        <div className="rz-hero-inner">
          <div className="rz-fade">
            <p className="rz-kicker">0DTE · Call or Put · Live tape only</p>
            <h1>{BRAND.name}</h1>
            <p className="rz-hero-sub">
              Put in starting money (try $100). The desk hands you one ticket:{" "}
              <strong>Call</strong> or <strong>Put</strong> — when to buy, take profit, and stop.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/desk/app" className="rz-btn">
                Start with $100
              </Link>
              <a href="#live-data" className="rz-btn rz-btn-ghost">
                How live data works
              </a>
            </div>
          </div>

          {primary && (
            <div className="rz-box rz-fade-delay">
              <div className="rz-box-head">
                <span>
                  {primary.symbol} · {primary.asOf}
                </span>
                <span className={`rz-side-pill ${primary.side === "Call" ? "call" : "put"}`}>
                  {primary.side}
                </span>
              </div>
              <div className="rz-box-body">
                <p
                  className={`desk-display text-5xl font-bold ${
                    primary.side === "Call" ? "text-[var(--rz-green)]" : "text-[var(--rz-red)]"
                  }`}
                >
                  {primary.side}
                </p>
                <p className="desk-mono mt-1 text-lg font-bold">${primary.ticket.strike}</p>
                <p className="mt-3 text-xs font-extrabold uppercase tracking-[0.14em] text-[var(--rz-muted)]">
                  When to take it
                </p>
                <p className="desk-mono text-lg font-bold text-[var(--rz-ink)]">
                  {primary.ticket.takeAt}
                </p>
                <p className="mt-1 text-xs text-[var(--rz-muted)]">
                  Open by {primary.ticket.enterBy} · flat by {primary.ticket.exitBy}
                </p>
                <div className="rz-box-grid">
                  <div className="rz-stat entry">
                    <div className="rz-stat-label">Buy</div>
                    <div className="rz-stat-value">${primary.ticket.entry.toFixed(2)}</div>
                  </div>
                  <div className="rz-stat tp">
                    <div className="rz-stat-label">TP</div>
                    <div className="rz-stat-value">${primary.ticket.takeProfit.toFixed(2)}</div>
                  </div>
                  <div className="rz-stat sl">
                    <div className="rz-stat-label">SL</div>
                    <div className="rz-stat-value">${primary.ticket.stopLoss.toFixed(2)}</div>
                  </div>
                </div>
                <p className="desk-mono mt-3 text-xs text-[var(--rz-muted)]">
                  {primary.ticket.contracts} ct · max loss ${primary.ticket.maxLoss.toFixed(0)}
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      <section id="live-data" className="rz-section border-t border-[var(--rz-line)] bg-white">
        <h2 className="rz-section-title">How live real-time data works</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {[
            [
              "1 · Live tape",
              "Nasdaq option chain + CBOE VIX + Yahoo session bars (or ThetaData / ORATS when wired).",
            ],
            [
              "2 · Snapshot",
              "We map that into one MarketSnapshot (spot, VWAP, VIX, GEX, opening range, chain).",
            ],
            [
              "3 · Ticket",
              "Same Call/Put rules engine prints Buy · TP · SL. Broker fills stay in your broker.",
            ],
          ].map(([t, b]) => (
            <div key={t}>
              <p className="font-extrabold uppercase tracking-wide">{t}</p>
              <p className="mt-2 text-sm text-[var(--rz-muted)]">{b}</p>
            </div>
          ))}
        </div>
        <p className="mt-6 max-w-3xl text-sm text-[var(--rz-muted)]">{liveDataExplainer}</p>
        <p className="desk-mono mt-3 text-xs text-[var(--rz-muted)]">
          Now: <strong className="text-[var(--rz-ink)]">{feed?.mode === "live" ? "LIVE" : "OFFLINE"}</strong>
          {feed ? <> via {feed.provider}</> : null}. Live tape only — no demo quotes.
        </p>
      </section>

      <section id="wire" className="rz-section">
        <h2 className="rz-section-title">The wire</h2>
        <div className="grid gap-4 md:grid-cols-[1.4fr_1fr]">
          <div className="rz-card">
            <div className="rz-card-head">
              <span>Headlines</span>
              <span>P/C {wire?.putCallRatio?.toFixed(2) ?? "—"}</span>
            </div>
            {(wire?.headlines ?? []).map((h) => (
              <div key={h} className="rz-wire-item">
                <span className="rz-badge mr-2">News</span>
                {h}
              </div>
            ))}
          </div>
          <div className="rz-card">
            <div className="rz-card-head">
              <span>Sentiment gate</span>
              <span className="rz-badge-green rz-badge">{wire?.flowBias ?? "neutral"}</span>
            </div>
            <div className="rz-wire-item">
              Headline score{" "}
              <strong className="desk-mono">{wire?.headlineScore?.toFixed(2) ?? "0.00"}</strong>
            </div>
            {(wire?.events ?? []).map((ev) => (
              <div key={ev.code} className="rz-wire-item">
                <span className="rz-badge-dark rz-badge mr-2">{ev.impact}</span>
                {ev.label} · {ev.minutesUntil > 0 ? `in ${ev.minutesUntil}m` : "printed"}
              </div>
            ))}
            {(primary?.regime.sentimentNotes ?? []).map((n) => (
              <div key={n} className="rz-wire-item text-[var(--rz-muted)]">
                {n}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="rules" className="border-t border-[var(--rz-line)] bg-white">
        <div className="rz-section grid gap-10 md:grid-cols-2">
          <div>
            <h2 className="rz-section-title">Call. Put. Done.</h2>
            <p className="text-[var(--rz-muted)]">
              Super simple like Robinhood: the desk only ever says Call or Put. Buy the contract,
              take profit at +50%, stop at −50%, flat by 15:00 ET. Sit on FOMC / CPI / NFP and when
              GEX + VIX say no.
            </p>
          </div>
          <ol className="space-y-4 text-sm">
            {[
              ["Regime + news", "VIX, opening range, GEX, headlines, put/call, event blackouts."],
              ["Call or Put", "Above VWAP / broke high → Call. Below / broke low → Put."],
              ["When", "Take it now — open within 15 minutes (no new entries after 13:30 ET)."],
              ["Strike", "~25Δ that fits your starting money."],
              ["Size", "Whole bankroll is the risk budget for that one contract."],
              ["Exits", "+50% take profit. −50% stop. Flat before the close."],
            ].map(([title, body], i) => (
              <li key={title} className="flex gap-4 border-b border-[var(--rz-line)] pb-3">
                <span className="desk-mono font-bold text-[var(--rz-red)]">0{i + 1}</span>
                <div>
                  <p className="font-extrabold uppercase tracking-wide text-[var(--rz-ink)]">
                    {title}
                  </p>
                  <p className="mt-1 text-[var(--rz-muted)]">{body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </main>
  );
}

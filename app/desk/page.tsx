import Link from "next/link";
import { BRAND, SETTINGS, scanForPlays } from "@/lib/desk";

export default function DeskLandingPage() {
  const { primary, wire } = scanForPlays();
  const tickerItems = [
    ...(wire?.headlines ?? []).map((h) => ({ sym: "WIRE", text: h })),
    {
      sym: "VIX",
      text: `Elevated ≥${SETTINGS.vixElevated} · Hot ≥${SETTINGS.vixHot}`,
    },
    {
      sym: "RISK",
      text: `${(SETTINGS.riskPerTrade * 100).toFixed(0)}% / trade · ${(SETTINGS.dailyLossLimit * 100).toFixed(0)}% daily hard stop`,
    },
    {
      sym: "EXIT",
      text: `${(SETTINGS.takeProfitPct * 100).toFixed(0)}% TP · ${SETTINGS.stopMultiple}× SL · flat by ${SETTINGS.timeExitEt}`,
    },
  ];

  return (
    <main>
      <div className="rz-ticker" aria-label="Live market wire">
        <div className="rz-ticker-live">
          <span className="rz-dot" />
          Live
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
            <p className="rz-kicker">0DTE · Rules desk · Not a prediction model</p>
            <h1>{BRAND.name}</h1>
            <p className="rz-hero-sub">
              {BRAND.tagline} Scans regime, GEX, news, and sentiment — then hands you one ticket:
              entry, take profit, stop.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/desk/app" className="rz-btn">
                Today’s play
              </Link>
              <a href="#rules" className="rz-btn rz-btn-ghost">
                How it calls plays
              </a>
            </div>
          </div>

          {primary && (
            <div className="rz-box rz-fade-delay">
              <div className="rz-box-head">
                <span>Box score · {primary.asOf}</span>
                <span className="rz-badge">{primary.regime.regime.replace("_", " ")}</span>
              </div>
              <div className="rz-box-body">
                <p className="desk-display text-3xl font-bold text-[var(--rz-ink)]">
                  {primary.symbol}
                </p>
                <p className="mt-1 text-sm text-[var(--rz-muted)]">{primary.title}</p>
                <div className="rz-box-grid">
                  <div className="rz-stat entry">
                    <div className="rz-stat-label">Entry</div>
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
                  Flat by {primary.ticket.exitBy} · {primary.ticket.contracts} ct · max loss $
                  {primary.ticket.maxLoss.toFixed(0)}
                </p>
              </div>
            </div>
          )}
        </div>
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
                {ev.label} ·{" "}
                {ev.minutesUntil > 0 ? `in ${ev.minutesUntil}m` : "printed"}
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
            <h2 className="rz-section-title">Call the play. Don’t guess.</h2>
            <p className="text-[var(--rz-muted)]">
              Settings from SpotGamma / FlashAlpha / tasty-style 0DTE desks and prop risk:
              defined-risk only, 1% per trade, 3% daily stop, 50% TP, 2× SL, flat by 15:00 ET.
              FOMC / CPI / NFP blackouts. Negative GEX + hot VIX = sit.
            </p>
          </div>
          <ol className="space-y-4 text-sm">
            {[
              ["Regime + news", "VIX, opening range, GEX, headlines, put/call, event blackouts."],
              ["Defined risk", "Verticals or iron condors. Max loss = (width − credit) × 100."],
              ["Strikes", "Short ~16Δ / VWAP distance. Long wing caps budgeted loss."],
              ["Size", "1% of account per trade. Hard daily 3% — then shut it down."],
              ["Exits", "50% profit. 2× credit stop. Flat before the final gamma spike."],
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

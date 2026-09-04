import Link from "next/link";
import { scanForPlays } from "@/lib/desk";

export default function DeskLandingPage() {
  const { primary } = scanForPlays();

  return (
    <main>
      <section className="mx-auto flex min-h-[88vh] max-w-[1100px] flex-col justify-center px-6 pb-16 pt-8">
        <div className="desk-animate-in max-w-3xl">
          <p className="desk-mono mb-4 text-xs uppercase tracking-[0.22em] text-[var(--desk-muted)]">
            0DTE · Rules engine · Not a prediction model
          </p>
          <h1 className="desk-display text-[clamp(3.2rem,9vw,6.5rem)] font-extrabold leading-[0.92] tracking-tight text-[var(--desk-ink)]">
            DESK
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-[var(--desk-muted)] md:text-xl">
            Scans the market. Picks the structure. Gives you one ticket:{" "}
            <span className="text-[var(--desk-ink)]">entry, take profit, stop.</span>
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link
              href="/desk/app"
              className="desk-display inline-flex items-center rounded-full bg-[var(--desk-ink)] px-7 py-3 text-sm font-semibold tracking-wide text-[#f3f5f0] transition hover:opacity-90"
            >
              Open today’s play
            </Link>
            <a
              href="#rules"
              className="text-sm font-medium text-[var(--desk-muted)] underline-offset-4 hover:text-[var(--desk-ink)] hover:underline"
            >
              How the rules work
            </a>
          </div>
        </div>

        {primary && (
          <div className="desk-animate-in-delay mt-16 max-w-xl border border-[var(--desk-line)] bg-[var(--desk-panel)] p-6 backdrop-blur-sm">
            <div className="mb-4 flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-[var(--desk-muted)]">
              <span className="desk-live-dot" />
              Live desk ticket · {primary.asOf}
            </div>
            <p className="desk-display text-2xl font-bold tracking-tight">{primary.symbol}</p>
            <p className="mt-1 text-sm text-[var(--desk-muted)]">{primary.title}</p>
            <div className="mt-6 grid grid-cols-3 gap-3">
              <TicketStat label="Entry" value={`$${primary.ticket.entry.toFixed(2)}`} tone="signal" />
              <TicketStat label="TP" value={`$${primary.ticket.takeProfit.toFixed(2)}`} tone="signal" />
              <TicketStat label="SL" value={`$${primary.ticket.stopLoss.toFixed(2)}`} tone="stop" />
            </div>
            <p className="desk-mono mt-4 text-xs text-[var(--desk-muted)]">
              Flat by {primary.ticket.exitBy} · {primary.ticket.contracts} contracts · max loss $
              {primary.ticket.maxLoss.toFixed(0)}
            </p>
          </div>
        )}
      </section>

      <section id="rules" className="border-t border-[var(--desk-line)] bg-[var(--desk-panel-solid)]/70">
        <div className="mx-auto grid max-w-[1100px] gap-10 px-6 py-20 md:grid-cols-2">
          <div className="desk-animate-in">
            <h2 className="desk-display text-3xl font-bold tracking-tight md:text-4xl">
              Structure first.
              <br />
              Never guess.
            </h2>
            <p className="mt-4 max-w-md text-[var(--desk-muted)]">
              Desk is a rules engine. It classifies the day, builds defined-risk only, sizes from
              worst case, and exits mechanically — then shows you a ticket a human can execute.
            </p>
          </div>
          <ol className="space-y-5 text-sm">
            {[
              ["Regime", "VIX + opening range + GEX. Negative GEX cuts size or refuses premium sales."],
              ["Defined risk", "Verticals or iron condors. Max loss = (width − credit) × 100."],
              ["Strikes", "Short leg by delta / VWAP distance. Long wing caps the budgeted loss."],
              ["Size", "1–2% of account per trade. Hard daily stop near 3% — then stop trading."],
              ["Exits", "50% profit target. 2× credit stop. Flat before the final gamma spike."],
            ].map(([title, body], i) => (
              <li key={title} className="flex gap-4 border-b border-[var(--desk-line)] pb-4">
                <span className="desk-mono text-[var(--desk-muted)]">0{i + 1}</span>
                <div>
                  <p className="font-semibold text-[var(--desk-ink)]">{title}</p>
                  <p className="mt-1 text-[var(--desk-muted)]">{body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <footer className="mx-auto flex max-w-[1100px] items-center justify-between px-6 py-10 text-xs text-[var(--desk-muted)]">
        <span className="desk-display font-bold tracking-wide text-[var(--desk-ink)]">DESK</span>
        <span>Paper first. Bid-ask backtests. Live small.</span>
      </footer>
    </main>
  );
}

function TicketStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "signal" | "stop";
}) {
  const bg = tone === "signal" ? "var(--desk-signal-soft)" : "var(--desk-stop-soft)";
  const fg = tone === "signal" ? "var(--desk-signal)" : "var(--desk-stop)";
  return (
    <div className="rounded-md px-3 py-3" style={{ background: bg }}>
      <p className="text-[10px] uppercase tracking-[0.16em]" style={{ color: fg }}>
        {label}
      </p>
      <p className="desk-mono mt-1 text-lg font-semibold" style={{ color: fg }}>
        {value}
      </p>
    </div>
  );
}

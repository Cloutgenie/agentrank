import Link from "next/link";
import { Logo, LogoMark } from "@/components/Logo";
import { PrimaryButton } from "@/components/ui";

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden noise">
      <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-lime/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 bottom-0 h-80 w-80 rounded-full bg-lime/10 blur-3xl" />

      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 md:px-8">
        <Logo size="md" />
        <Link
          href="/picks"
          className="rounded-full border border-line bg-surface px-4 py-2 text-xs font-bold uppercase tracking-wide text-mist hover:border-lime/50"
        >
          Enter app
        </Link>
      </header>

      <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-20 pt-8 md:grid-cols-2 md:px-8 md:pt-16">
        <div className="animate-rise">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-lime/30 bg-lime/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-lime">
            <LogoMark className="h-4 w-4" /> NFL · CFB · NBA
          </p>
          <h1 className="font-display text-5xl uppercase leading-[0.9] tracking-tight text-mist md:text-7xl">
            Beat the
            <br />
            <span className="text-lime">board.</span>
          </h1>
          <p className="mt-5 max-w-md text-base leading-relaxed text-mute md:text-lg">
            Consensus model for NFL, College Football, and NBA. Ranked winners and Monte Carlo
            lineups for PrizePicks &amp; Underdog — one tap to the slip.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/picks">
              <PrimaryButton className="animate-pulse-lime px-7 py-3">Today&apos;s picks</PrimaryButton>
            </Link>
            <Link
              href="/lineups"
              className="inline-flex items-center rounded-full border border-line px-6 py-3 text-sm font-bold uppercase tracking-wide text-mist hover:border-lime/40"
            >
              Build lineups
            </Link>
          </div>
        </div>

        <div className="animate-rise-2 relative">
          <div className="pick-card relative overflow-hidden p-6 shadow-lime">
            <div className="absolute right-0 top-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-lime/20 blur-2xl" />
            <div className="relative flex items-start justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-mute">
                  Featured edge
                </p>
                <p className="mt-2 font-display text-4xl uppercase text-mist">KC</p>
                <p className="text-sm text-mute">vs BUF · Moneyline</p>
              </div>
              <div className="rounded-2xl bg-lime px-4 py-3 text-center text-void">
                <p className="text-[10px] font-bold uppercase tracking-wider">Edge</p>
                <p className="font-display text-3xl leading-none">+4.2</p>
              </div>
            </div>

            <div className="side-toggle mt-6">
              <button type="button" data-active="true">
                Higher edge
              </button>
              <button type="button" data-active="false">
                Market
              </button>
            </div>

            <div className="mt-6 space-y-3">
              {[
                ["Model", "62%"],
                ["Market", "57%"],
                ["Elo blend", "64%"],
              ].map(([k, v]) => (
                <div
                  key={k}
                  className="flex items-center justify-between border-t border-line pt-3 text-sm"
                >
                  <span className="text-mute">{k}</span>
                  <span className="font-bold text-mist">{v}</span>
                </div>
              ))}
            </div>

            <PrimaryButton
              href="https://robinhood.com/us/en/prediction-markets/"
              className="mt-6 w-full"
            >
              Open on Robinhood
            </PrimaryButton>
          </div>
        </div>
      </section>
    </main>
  );
}

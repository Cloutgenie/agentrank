import Link from "next/link";
import { Nav } from "@/components/Nav";
import { PrimaryButton } from "@/components/ui";

export default function HomePage() {
  return (
    <main className="court-grid min-h-screen">
      <Nav />
      <section className="relative mx-auto grid min-h-[calc(100vh-5.5rem)] max-w-6xl items-center gap-10 px-6 pb-16 pt-4 md:grid-cols-2 md:px-10">
        <div className="animate-rise">
          <p className="font-display text-5xl leading-none tracking-tight text-ink md:text-7xl">
            Edge<span className="text-edge">Slate</span>
          </p>
          <h1 className="mt-5 max-w-md text-2xl font-semibold leading-snug text-ink/90 md:text-3xl">
            Beat the board. Ship the lineup.
          </h1>
          <p className="mt-4 max-w-md text-base text-ink/65">
            Consensus model over sportsbooks and prediction markets — ranked NBA winners plus
            Monte Carlo–optimized PrizePicks and Underdog slips.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/picks">
              <PrimaryButton>Open today&apos;s slate</PrimaryButton>
            </Link>
            <Link
              href="/lineups"
              className="inline-flex items-center rounded-md border border-ink/15 bg-white/70 px-5 py-2.5 text-sm font-semibold text-ink"
            >
              Optimize lineups
            </Link>
          </div>
        </div>

        <div className="hero-sheen animate-rise-delay relative aspect-[4/5] overflow-hidden rounded-2xl bg-slateboard text-white shadow-glow md:aspect-square">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(18,184,134,0.45),transparent_45%),radial-gradient(circle_at_80%_80%,rgba(40,90,200,0.35),transparent_40%)]" />
          <div className="absolute inset-0 court-grid opacity-40" />
          <div className="relative z-10 flex h-full flex-col justify-between p-8">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-white/50">Live edge feed</p>
              <p className="mt-3 font-display text-5xl leading-none">+4.2 pp</p>
              <p className="mt-2 text-sm text-white/70">OKC vs market after vig</p>
            </div>
            <div className="space-y-3">
              {[
                ["BOS", "56% model · 52% market"],
                ["CLE", "61% model · 57% market"],
                ["MIN", "58% model · 54% market"],
              ].map(([team, meta]) => (
                <div
                  key={team}
                  className="flex items-center justify-between border-t border-white/10 pt-3 text-sm"
                >
                  <span className="font-display text-2xl tracking-wide">{team}</span>
                  <span className="text-white/60">{meta}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="absolute -right-8 bottom-16 h-40 w-40 animate-pulse-edge rounded-full border-2 border-edge/40" />
        </div>
      </section>
    </main>
  );
}

import Link from "next/link";

const links = [
  { href: "/picks", label: "Game Picker" },
  { href: "/lineups", label: "Lineups" },
  { href: "/backtest", label: "Backtest" },
];

export function Nav({ active }: { active?: string }) {
  return (
    <header className="relative z-20 flex items-center justify-between px-6 py-5 md:px-10">
      <Link href="/" className="font-display text-2xl tracking-tight text-ink md:text-3xl">
        Edge<span className="text-edge">Slate</span>
      </Link>
      <nav className="flex items-center gap-1 text-sm md:gap-2">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={`rounded-md px-3 py-2 transition ${
              active === l.href
                ? "bg-ink text-white"
                : "text-ink/70 hover:bg-ink/5 hover:text-ink"
            }`}
          >
            {l.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}

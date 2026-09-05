import Link from "next/link";
import { Logo } from "@/components/Logo";

const links = [
  { href: "/picks", label: "Picks" },
  { href: "/lineups", label: "Lineups" },
  { href: "/backtest", label: "Backtest" },
];

export function Nav({ active }: { active?: string }) {
  return (
    <header className="sticky top-0 z-30 border-b border-line/80 bg-void/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 md:px-8">
        <Logo size="sm" />
        <nav className="flex items-center gap-1 overflow-x-auto rounded-full border border-line bg-surface p-1">
          {links.map((l) => {
            const on = active === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-bold uppercase tracking-wide transition md:text-sm ${
                  on ? "bg-lime text-void" : "text-mute hover:text-mist"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}

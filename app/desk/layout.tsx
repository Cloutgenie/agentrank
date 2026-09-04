import type { Metadata } from "next";
import { Syne, IBM_Plex_Mono, DM_Sans } from "next/font/google";
import Link from "next/link";
import "./desk.css";

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-desk-display",
  weight: ["500", "600", "700", "800"],
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-desk-sans",
  weight: ["400", "500", "600", "700"],
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-desk-mono",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: {
    default: "Desk — 0DTE rules, not predictions",
    template: "%s · Desk",
  },
  description:
    "A 0DTE trading desk that scans the market with explicit rules and gives you one play: buy here, take profit here, stop here.",
};

export default function DeskRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`desk-theme ${syne.variable} ${dmSans.variable} ${plexMono.variable} min-h-screen`}
    >
      <header className="desk-nav">
        <Link href="/desk" className="desk-brand">
          DESK
        </Link>
        <nav className="desk-nav-links">
          <Link href="/desk/app">Today’s play</Link>
          <Link href="/desk#rules">Rules</Link>
          <Link href="/desk/app" className="desk-nav-cta">
            Open desk
          </Link>
        </nav>
      </header>
      {children}
    </div>
  );
}

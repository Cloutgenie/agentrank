import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Oswald, IBM_Plex_Mono, Source_Sans_3 } from "next/font/google";
import { BRAND } from "@/lib/desk";
import "./desk.css";

const display = Oswald({
  subsets: ["latin"],
  variable: "--font-desk-display",
  weight: ["500", "600", "700"],
});

const sans = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-desk-sans",
  weight: ["400", "600", "700", "800"],
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-desk-mono",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: `${BRAND.name} — ${BRAND.tagline}`,
    template: `%s · ${BRAND.name}`,
  },
  description:
    "0DTE rules desk. Robinhood-simple: Call or Put — Buy, take profit, stop. Demo or live bid/ask via ThetaData / ORATS.",
};

export default function DeskLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`desk-theme ${display.variable} ${sans.variable} ${mono.variable}`}>
      <div className="rz-topbar">
        <Link href="/desk" className="rz-logo" aria-label={BRAND.name}>
          <Image
            src="/desk/redzone-mark.svg"
            alt={BRAND.name}
            width={160}
            height={28}
            priority
          />
        </Link>
        <nav className="rz-nav">
          <Link href="/desk/app">Today’s play</Link>
          <Link href="/desk#rules">Rules</Link>
          <Link href="/desk#wire">Wire</Link>
          <Link href="/desk/app" className="rz-nav-cta">
            Open desk
          </Link>
        </nav>
      </div>
      {children}
      <footer className="rz-footer">
        <div className="rz-footer-inner">
          <strong>{BRAND.name}</strong>
          <span>Rules engine · Defined risk · Paper first</span>
        </div>
      </footer>
    </div>
  );
}

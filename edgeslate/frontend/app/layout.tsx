import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EdgeSlate — Beat the board",
  description:
    "NBA game edges and PrizePicks / Underdog lineup optimizer. Market consensus meets Monte Carlo.",
  icons: { icon: "/logo.png", apple: "/logo.png" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="noise">{children}</body>
    </html>
  );
}

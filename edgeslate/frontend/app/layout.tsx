import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EdgeSlate — AI Sports Prediction & DFS Optimizer",
  description:
    "Ranked NBA game winners and optimized PrizePicks / Underdog lineups with market-beating edge.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

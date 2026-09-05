import { DEMO_BACKTEST, DEMO_LINEUPS, DEMO_PICKS } from "@/lib/demo";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

export type SportId = "NBA" | "NFL" | "CFB";

export const SPORTS: { id: SportId; label: string }[] = [
  { id: "NFL", label: "NFL" },
  { id: "CFB", label: "CFB" },
  { id: "NBA", label: "NBA" },
];

export type GamePick = {
  game_id: number;
  sport?: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  pick_side: string;
  pick_team: string;
  model_prob: number;
  market_prob: number;
  elo_prob: number;
  edge_pp: number;
  confidence: number;
  deep_link?: string | null;
  status: string;
};

export type PropPick = {
  player_name: string;
  team_abbr?: string | null;
  stat_type: string;
  line: number;
  side: string;
  model_mean: number;
  hit_prob: number;
  edge: number;
  platform_id?: string | null;
};

export type Lineup = {
  rank: number;
  platform: string;
  sport?: string;
  expected_value: number;
  win_prob: number;
  salary_used?: number | null;
  picks: PropPick[];
  deep_link?: string | null;
};

export type BacktestSummary = {
  total_picks: number;
  graded_picks: number;
  wins: number;
  win_rate: number;
  avg_edge_pp: number;
  avg_model_prob: number;
  positive_ev: boolean;
  launch_ready: boolean;
  calibration: { bucket: string; predicted: number; actual: number; count: number }[];
  notes: string;
};

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  if (!API_URL) throw new Error("API not configured");
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`API ${path} failed: ${res.status}`);
  return res.json() as Promise<T>;
}

async function withDemo<T>(fn: () => Promise<T>, demo: T): Promise<T> {
  try {
    return await fn();
  } catch {
    return demo;
  }
}

function qs(params: Record<string, string | undefined>) {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v) sp.set(k, v);
  });
  const s = sp.toString();
  return s ? `?${s}` : "";
}

export const client = {
  health: () =>
    withDemo(
      () => api<{ status: string; demo_mode: boolean; sport?: string }>("/health"),
      { status: "ok", demo_mode: true, sport: "NFL" }
    ),
  gamePicks: (sport: SportId = "NFL") =>
    withDemo(
      () => api<GamePick[]>(`/api/picks/games${qs({ sport })}`),
      DEMO_PICKS.filter((p) => (p.sport || "NBA") === sport)
    ),
  lineups: (platform: string, sport: SportId = "NFL") =>
    withDemo(
      () => api<Lineup[]>(`/api/lineups${qs({ platform, sport })}`),
      DEMO_LINEUPS.filter((l) => (l.sport || "NBA") === sport).map((l) => ({ ...l, platform }))
    ),
  optimize: (platform: string, sport: SportId = "NFL", slate_size = 5) =>
    withDemo(
      () =>
        api<Lineup[]>("/api/lineups/optimize", {
          method: "POST",
          body: JSON.stringify({ platform, sport, slate_size, top_n: 5, max_from_team: 3 }),
        }),
      DEMO_LINEUPS.filter((l) => (l.sport || "NBA") === sport).map((l) => ({ ...l, platform }))
    ),
  backtest: () => withDemo(() => api<BacktestSummary>("/api/backtest/summary"), DEMO_BACKTEST),
  seedDemo: (sport?: SportId) =>
    withDemo(
      () => api<{ ok: boolean; message: string }>(`/api/ingest/demo${qs({ sport })}`, { method: "POST" }),
      { ok: true, message: "Demo mode — using local slate" }
    ),
  runPipeline: (sport?: SportId) =>
    withDemo(
      () =>
        api<{ ok: boolean; message: string; stats: Record<string, unknown> }>(
          `/api/ingest/run${qs({ sport })}`,
          { method: "POST" }
        ),
      { ok: true, message: "Demo mode", stats: {} }
    ),
};

export function pct(n: number, digits = 1) {
  return `${(n * 100).toFixed(digits)}%`;
}

export function edgeLabel(pp: number) {
  return `+${pp.toFixed(1)}`;
}

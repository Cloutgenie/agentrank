const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export type GamePick = {
  game_id: number;
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
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`API ${path} failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const client = {
  health: () => api<{ status: string; demo_mode: boolean }>("/health"),
  gamePicks: () => api<GamePick[]>("/api/picks/games"),
  lineups: (platform: string) => api<Lineup[]>(`/api/lineups?platform=${platform}`),
  optimize: (platform: string, slate_size = 5) =>
    api<Lineup[]>("/api/lineups/optimize", {
      method: "POST",
      body: JSON.stringify({ platform, slate_size, top_n: 5, max_from_team: 3 }),
    }),
  backtest: () => api<BacktestSummary>("/api/backtest/summary"),
  seedDemo: () =>
    api<{ ok: boolean; message: string }>("/api/ingest/demo", { method: "POST" }),
  runPipeline: () =>
    api<{ ok: boolean; message: string; stats: Record<string, unknown> }>("/api/ingest/run", {
      method: "POST",
    }),
};

export function pct(n: number, digits = 1) {
  return `${(n * 100).toFixed(digits)}%`;
}

export function edgeLabel(pp: number) {
  return `+${pp.toFixed(1)} pp`;
}

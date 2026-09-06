/** Live game picks from The Odds API (server-only). */

export type SportId = "NBA" | "NFL" | "CFB";

export type LiveGamePick = {
  game_id: number;
  sport: SportId;
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

const ODDS_SPORT: Record<SportId, string> = {
  NFL: "americanfootball_nfl",
  CFB: "americanfootball_ncaaf",
  NBA: "basketball_nba",
};

const HOME_ELO: Record<SportId, number> = { NFL: 48, CFB: 55, NBA: 60 };
const EDGE_MIN = 2.0;
const W_MARKET = 0.7;
const W_ELO = 0.3;
const DAYS_AHEAD = 14;

type Outcome = { name: string; price: number };
type Market = { key: string; outcomes: Outcome[] };
type Book = { key: string; markets: Market[] };
type EventRow = {
  id: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers?: Book[];
};

function impliedFromAmerican(american: number): number {
  if (american === 0) return 0.5;
  if (american > 0) return 100 / (american + 100);
  return Math.abs(american) / (Math.abs(american) + 100);
}

function devig(a: number, b: number): [number, number] {
  const t = a + b;
  if (t <= 0) return [0.5, 0.5];
  return [a / t, b / t];
}

function clamp01(x: number): number {
  return Math.max(0.01, Math.min(0.99, x));
}

function homeEloProb(adv: number): number {
  return 1 / (1 + Math.pow(10, -adv / 400));
}

function teamAbbr(name: string): string {
  const map: Record<string, string> = {
    "Kansas City Chiefs": "KC",
    "Buffalo Bills": "BUF",
    "Detroit Lions": "DET",
    "Philadelphia Eagles": "PHI",
    "San Francisco 49ers": "SF",
    "Dallas Cowboys": "DAL",
    "Green Bay Packers": "GB",
    "Baltimore Ravens": "BAL",
    "Miami Dolphins": "MIA",
    "New York Jets": "NYJ",
    "New York Giants": "NYG",
    "Los Angeles Rams": "LAR",
    "Los Angeles Chargers": "LAC",
    "Las Vegas Raiders": "LV",
    "Denver Broncos": "DEN",
    "Chicago Bears": "CHI",
    "Minnesota Vikings": "MIN",
    "Tampa Bay Buccaneers": "TB",
    "New Orleans Saints": "NO",
    "Atlanta Falcons": "ATL",
    "Carolina Panthers": "CAR",
    "Seattle Seahawks": "SEA",
    "Arizona Cardinals": "ARI",
    "Washington Commanders": "WAS",
    "Cleveland Browns": "CLE",
    "Cincinnati Bengals": "CIN",
    "Pittsburgh Steelers": "PIT",
    "Houston Texans": "HOU",
    "Indianapolis Colts": "IND",
    "Jacksonville Jaguars": "JAX",
    "Tennessee Titans": "TEN",
    "New England Patriots": "NE",
    "Boston Celtics": "BOS",
    "Oklahoma City Thunder": "OKC",
    "Denver Nuggets": "DEN",
    "Los Angeles Lakers": "LAL",
    "Golden State Warriors": "GSW",
    "Milwaukee Bucks": "MIL",
    "Phoenix Suns": "PHX",
    "Dallas Mavericks": "DAL",
    "Miami Heat": "MIA",
    "New York Knicks": "NYK",
    "Georgia Bulldogs": "UGA",
    "Alabama Crimson Tide": "ALA",
    "Ohio State Buckeyes": "OHIO",
    "Texas Longhorns": "TEX",
    "Michigan Wolverines": "MICH",
    "Oregon Ducks": "ORE",
    "Clemson Tigers": "CLEM",
    "Notre Dame Fighting Irish": "ND",
  };
  if (map[name]) return map[name];
  const parts = name.replace(/[^a-zA-Z0-9 ]/g, "").split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 4).toUpperCase();
  return parts.slice(0, 3).map((p) => p[0]).join("").toUpperCase();
}

function inWindow(iso: string): boolean {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return false;
  const now = Date.now();
  return t >= now - 3 * 3600_000 && t <= now + DAYS_AHEAD * 86400_000;
}

function marketHomeProb(event: EventRow): number | null {
  const probs: number[] = [];
  for (const book of event.bookmakers || []) {
    const h2h = book.markets?.find((m) => m.key === "h2h");
    if (!h2h?.outcomes?.length) continue;
    const home = h2h.outcomes.find((o) => o.name === event.home_team);
    const away = h2h.outcomes.find((o) => o.name === event.away_team);
    if (!home || !away) continue;
    const [hp] = devig(impliedFromAmerican(home.price), impliedFromAmerican(away.price));
    probs.push(hp);
  }
  if (!probs.length) return null;
  return probs.reduce((a, b) => a + b, 0) / probs.length;
}

function toPick(event: EventRow, sport: SportId, index: number): LiveGamePick | null {
  const mktHome = marketHomeProb(event);
  if (mktHome == null) return null;

  const eloHome = clamp01(homeEloProb(HOME_ELO[sport]));
  const modelHome = clamp01((W_MARKET * mktHome + W_ELO * eloHome) / (W_MARKET + W_ELO));
  const modelAway = 1 - modelHome;
  const mktAway = 1 - mktHome;

  const edgeHome = (modelHome - mktHome) * 100;
  const edgeAway = (modelAway - mktAway) * 100;

  const home = teamAbbr(event.home_team);
  const away = teamAbbr(event.away_team);
  const takeHome = edgeHome >= edgeAway;
  const edge = takeHome ? edgeHome : edgeAway;

  return {
    game_id: index + 1,
    sport,
    commence_time: event.commence_time,
    home_team: home,
    away_team: away,
    pick_side: takeHome ? "home" : "away",
    pick_team: takeHome ? home : away,
    model_prob: takeHome ? modelHome : modelAway,
    market_prob: takeHome ? mktHome : mktAway,
    elo_prob: takeHome ? eloHome : 1 - eloHome,
    edge_pp: Math.round(edge * 10) / 10,
    confidence: clamp01(0.5 + Math.abs(edge) / 20),
    deep_link: null,
    status: edge >= EDGE_MIN ? "pick" : "watch",
  };
}

function readOddsKey(): string {
  return process.env.ODDS_API_KEY?.trim() || process.env.THE_ODDS_API_KEY?.trim() || "";
}

export function oddsApiConfigured(): boolean {
  return Boolean(readOddsKey());
}

export async function fetchLiveGamePicks(sport: SportId): Promise<{
  picks: LiveGamePick[];
  source: "live" | "unconfigured";
  event_count: number;
}> {
  const key = readOddsKey();
  if (!key) {
    return { picks: [], source: "unconfigured", event_count: 0 };
  }

  const url = new URL(`https://api.the-odds-api.com/v4/sports/${ODDS_SPORT[sport]}/odds`);
  url.searchParams.set("apiKey", key);
  url.searchParams.set("regions", "us");
  url.searchParams.set("markets", "h2h");
  url.searchParams.set("oddsFormat", "american");

  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Odds API ${res.status}: ${body.slice(0, 200)}`);
  }

  const raw = (await res.json()) as EventRow[];
  const events = raw.filter((e) => inWindow(e.commence_time));

  const scored = events
    .map((e, i) => toPick(e, sport, i))
    .filter((p): p is LiveGamePick => p != null)
    .sort((a, b) => b.edge_pp - a.edge_pp);

  const edged = scored.filter((p) => p.edge_pp >= EDGE_MIN);
  const picks = edged.length > 0 ? edged : scored.slice(0, 12);

  return { picks, source: "live", event_count: events.length };
}

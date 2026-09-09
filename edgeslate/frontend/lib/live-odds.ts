/** Live game picks from The Odds API (server-only). */

import { HOME_ADVANTAGE, teamElo, type SportId } from "@/lib/team-ratings";

export type { SportId };

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

/**
 * Market-led blend. Elo may only nudge toss-up games — never fade huge
 * live prices just because a static rating table disagrees.
 */
const EDGE_MIN = 4.0;
const W_MARKET = 0.9;
const W_ELO = 0.1;
/** Only promote a PICK when the live market is still uncertain. */
const TOSS_UP_LO = 0.32;
const TOSS_UP_HI = 0.68;
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

function deVig(a: number, b: number): [number, number] {
  const t = a + b;
  if (t <= 0) return [0.5, 0.5];
  return [a / t, b / t];
}

function clamp01(x: number): number {
  return Math.max(0.01, Math.min(0.99, x));
}

/** P(home wins) from Elo ratings with home-field bump on home. */
function eloHomeWinProb(homeElo: number, awayElo: number, homeAdv: number): number {
  const diff = homeElo + homeAdv - awayElo;
  return 1 / (1 + Math.pow(10, -diff / 400));
}

function blend(market: number, elo: number, mw: number, ew: number): number {
  const t = mw + ew;
  if (t <= 0) return market;
  return (mw * market + ew * elo) / t;
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
    "Los Angeles Clippers": "LAC",
    "Golden State Warriors": "GSW",
    "Milwaukee Bucks": "MIL",
    "Phoenix Suns": "PHX",
    "Dallas Mavericks": "DAL",
    "Miami Heat": "MIA",
    "New York Knicks": "NYK",
    "Cleveland Cavaliers": "CLE",
    "Minnesota Timberwolves": "MIN",
    "Indiana Pacers": "IND",
    "Philadelphia 76ers": "PHI",
    "Orlando Magic": "ORL",
    "New Orleans Pelicans": "NOP",
    "Sacramento Kings": "SAC",
    "Houston Rockets": "HOU",
    "Memphis Grizzlies": "MEM",
    "Atlanta Hawks": "ATL",
    "Chicago Bulls": "CHI",
    "San Antonio Spurs": "SAS",
    "Toronto Raptors": "TOR",
    "Brooklyn Nets": "BKN",
    "Utah Jazz": "UTA",
    "Portland Trail Blazers": "POR",
    "Washington Wizards": "WAS",
    "Charlotte Hornets": "CHA",
    "Detroit Pistons": "DET",
    "Georgia Bulldogs": "UGA",
    "Alabama Crimson Tide": "ALA",
    "Ohio State Buckeyes": "OHIO",
    "Texas Longhorns": "TEX",
    "Michigan Wolverines": "MICH",
    "Oregon Ducks": "ORE",
    "Clemson Tigers": "CLEM",
    "Notre Dame Fighting Irish": "ND",
    "Penn State Nittany Lions": "PSU",
    "Ole Miss Rebels": "MISS",
    "Tennessee Volunteers": "TENN",
    "Miami Hurricanes": "MIA",
    "LSU Tigers": "LSU",
    "USC Trojans": "USC",
    "Florida State Seminoles": "FSU",
  };
  if (map[name]) return map[name];
  const parts = name.replace(/[^a-zA-Z0-9 ]/g, "").split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 4).toUpperCase();
  return parts
    .slice(0, 3)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
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
    const [hp] = deVig(impliedFromAmerican(home.price), impliedFromAmerican(away.price));
    probs.push(hp);
  }
  if (!probs.length) return null;
  return probs.reduce((a, b) => a + b, 0) / probs.length;
}

/**
 * Score one event. When either team lacks an Elo rating, Elo tracks market
 * (zero invented edge) so the board stays honest live odds — not fake picks.
 */
export function scoreEvent(event: EventRow, sport: SportId, index: number): LiveGamePick | null {
  const mktHome = marketHomeProb(event);
  if (mktHome == null) return null;

  const homeRating = teamElo(sport, event.home_team);
  const awayRating = teamElo(sport, event.away_team);
  const rated = homeRating != null && awayRating != null;

  const eloHome = rated
    ? clamp01(eloHomeWinProb(homeRating!, awayRating!, HOME_ADVANTAGE[sport]))
    : clamp01(mktHome);

  const modelHome = clamp01(blend(mktHome, eloHome, W_MARKET, W_ELO));
  const modelAway = 1 - modelHome;
  const mktAway = 1 - mktHome;

  const edgeHome = (modelHome - mktHome) * 100;
  const edgeAway = (modelAway - mktAway) * 100;

  const home = teamAbbr(event.home_team);
  const away = teamAbbr(event.away_team);
  const takeHome = edgeHome >= edgeAway;
  const edge = takeHome ? edgeHome : edgeAway;
  const modelProb = takeHome ? modelHome : modelAway;
  const marketProb = takeHome ? mktHome : mktAway;
  const eloProb = takeHome ? eloHome : 1 - eloHome;

  // Honest live board: never invent picks against one-sided markets, and
  // never label a pick when we lack per-team ratings.
  const tossUp = marketProb >= TOSS_UP_LO && marketProb <= TOSS_UP_HI;
  const status = rated && tossUp && edge >= EDGE_MIN ? "pick" : "watch";

  return {
    game_id: index + 1,
    sport,
    commence_time: event.commence_time,
    home_team: home,
    away_team: away,
    pick_side: takeHome ? "home" : "away",
    pick_team: takeHome ? home : away,
    model_prob: modelProb,
    market_prob: marketProb,
    elo_prob: eloProb,
    edge_pp: Math.round(edge * 10) / 10,
    confidence: clamp01(Math.abs(modelProb - 0.5) * 2 * (edge / 10 + 0.5)),
    deep_link: null,
    status,
  };
}

function readOddsKey(): string {
  // Accept common Vercel paste mistakes: quoted values, accidental prefixes.
  const raw =
    process.env.ODDS_API_KEY ||
    process.env.THE_ODDS_API_KEY ||
    process.env.ODDS_KEY ||
    "";
  return raw
    .trim()
    .replace(/^ODDS_API_KEY\s*=\s*/i, "")
    .replace(/^["']|["']$/g, "")
    .trim();
}

export function oddsApiConfigured(): boolean {
  return Boolean(readOddsKey());
}

/** Safe diagnostics for /health — never returns the key itself. */
export function readOddsKeyPublicMeta(): { configured: boolean; length: number } {
  const key = readOddsKey();
  return { configured: key.length > 0, length: key.length };
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

  const picks = events
    .map((e, i) => scoreEvent(e, sport, i))
    .filter((p): p is LiveGamePick => p != null)
    .sort((a, b) => {
      const aPick = a.status === "pick" ? 1 : 0;
      const bPick = b.status === "pick" ? 1 : 0;
      if (bPick !== aPick) return bPick - aPick;
      return b.edge_pp - a.edge_pp;
    });

  return { picks, source: "live", event_count: events.length };
}

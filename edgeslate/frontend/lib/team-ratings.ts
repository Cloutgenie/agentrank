/**
 * Per-team Elo ratings keyed by The Odds API full team names.
 * Unknown teams return null so we never invent edges from a flat home bump.
 */

export type SportId = "NBA" | "NFL" | "CFB";

/** Home-field Elo bump by sport (matches backend sports registry). */
export const HOME_ADVANTAGE: Record<SportId, number> = {
  NFL: 48,
  CFB: 55,
  NBA: 60,
};

/** NFL — relative power for 2025/26 (mean ~1500). */
const NFL_ELO: Record<string, number> = {
  "Kansas City Chiefs": 1720,
  "Buffalo Bills": 1705,
  "Baltimore Ravens": 1690,
  "Detroit Lions": 1680,
  "Philadelphia Eagles": 1675,
  "San Francisco 49ers": 1665,
  "Green Bay Packers": 1635,
  "Cincinnati Bengals": 1625,
  "Houston Texans": 1615,
  "Minnesota Vikings": 1600,
  "Los Angeles Rams": 1595,
  "Seattle Seahawks": 1585,
  "Pittsburgh Steelers": 1575,
  "Miami Dolphins": 1560,
  "Dallas Cowboys": 1550,
  "Los Angeles Chargers": 1545,
  "Tampa Bay Buccaneers": 1535,
  "Atlanta Falcons": 1520,
  "Chicago Bears": 1510,
  "Washington Commanders": 1505,
  "Indianapolis Colts": 1495,
  "Arizona Cardinals": 1475,
  "New York Jets": 1465,
  "Jacksonville Jaguars": 1455,
  "Denver Broncos": 1450,
  "New Orleans Saints": 1440,
  "Las Vegas Raiders": 1425,
  "Cleveland Browns": 1415,
  "Tennessee Titans": 1400,
  "New York Giants": 1385,
  "Carolina Panthers": 1370,
  "New England Patriots": 1360
};

/** NBA — relative power (mean ~1500). */
const NBA_ELO: Record<string, number> = {
  "Oklahoma City Thunder": 1700,
  "Boston Celtics": 1685,
  "Denver Nuggets": 1640,
  "Minnesota Timberwolves": 1620,
  "New York Knicks": 1610,
  "Cleveland Cavaliers": 1605,
  "Dallas Mavericks": 1595,
  "Los Angeles Clippers": 1585,
  "Phoenix Suns": 1575,
  "Milwaukee Bucks": 1570,
  "Indiana Pacers": 1565,
  "Golden State Warriors": 1560,
  "Los Angeles Lakers": 1555,
  "Orlando Magic": 1545,
  "New Orleans Pelicans": 1535,
  "Sacramento Kings": 1530,
  "Miami Heat": 1525,
  "Philadelphia 76ers": 1520,
  "Houston Rockets": 1515,
  "Memphis Grizzlies": 1505,
  "Atlanta Hawks": 1495,
  "Chicago Bulls": 1485,
  "San Antonio Spurs": 1480,
  "Toronto Raptors": 1470,
  "Brooklyn Nets": 1460,
  "Utah Jazz": 1450,
  "Portland Trail Blazers": 1440,
  "Washington Wizards": 1425,
  "Charlotte Hornets": 1415,
  "Detroit Pistons": 1410,
};

/** Major CFB — relative power. Unlisted teams → no Elo edge. */
const CFB_ELO: Record<string, number> = {
  "Georgia Bulldogs": 1740,
  "Alabama Crimson Tide": 1715,
  "Ohio State Buckeyes": 1710,
  "Texas Longhorns": 1700,
  "Oregon Ducks": 1685,
  "Penn State Nittany Lions": 1665,
  "Notre Dame Fighting Irish": 1655,
  "Michigan Wolverines": 1645,
  "Ole Miss Rebels": 1635,
  "Tennessee Volunteers": 1630,
  "Miami Hurricanes": 1625,
  "LSU Tigers": 1620,
  "USC Trojans": 1610,
  "Clemson Tigers": 1605,
  "Florida State Seminoles": 1590,
  "Utah Utes": 1585,
  "Texas A&M Aggies": 1580,
  "Missouri Tigers": 1575,
  "Oklahoma Sooners": 1570,
  "Iowa Hawkeyes": 1560,
  "Kansas State Wildcats": 1555,
  "Louisville Cardinals": 1550,
  "Wisconsin Badgers": 1540,
  "Auburn Tigers": 1535,
  "Florida Gators": 1530,
  "SMU Mustangs": 1525,
  "UCLA Bruins": 1520,
  "Washington Huskies": 1515,
  "Nebraska Cornhuskers": 1505,
  "Arizona Wildcats": 1500,
  "North Carolina Tar Heels": 1495,
  "James Madison Dukes": 1490,
  "Virginia Tech Hokies": 1485,
  "Liberty Flames": 1485,
  "Oklahoma State Cowboys": 1480,
  "TCU Horned Frogs": 1475,
  "Tulane Green Wave": 1475,
  "Baylor Bears": 1470,
  "Memphis Tigers": 1470,
  "Kentucky Wildcats": 1465,
  "South Carolina Gamecocks": 1460,
  "UNLV Rebels": 1460,
  "Arkansas Razorbacks": 1455,
  "Fresno State Bulldogs": 1455,
  "Mississippi State Bulldogs": 1450,
  "Boise State Broncos": 1545,
  "Purdue Boilermakers": 1440,
  "Indiana Hoosiers": 1435,
  "Illinois Fighting Illini": 1430,
  "Michigan State Spartans": 1425,
  "California Golden Bears": 1420,
  "Stanford Cardinal": 1410,
  "Colorado Buffaloes": 1405,
  "Arizona State Sun Devils": 1400,
};

const BY_SPORT: Record<SportId, Record<string, number>> = {
  NFL: NFL_ELO,
  NBA: NBA_ELO,
  CFB: CFB_ELO,
};

export function teamElo(sport: SportId, fullName: string): number | null {
  const table = BY_SPORT[sport];
  if (table[fullName] != null) return table[fullName];
  const lower = fullName.toLowerCase();
  for (const [name, elo] of Object.entries(table)) {
    if (lower === name.toLowerCase()) return elo;
  }
  return null;
}

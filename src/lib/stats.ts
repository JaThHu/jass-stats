import { gamesOfEvening, progression, roundPoints, roundsOfGame, totals, weisPair, type Pair } from './scoring';
import {
  CHRITZ_VALUE,
  type AppData,
  type Chritz,
  type ChritzType,
  type Evening,
  type Game,
  type Round,
  type TeamIndex,
} from './types';

export type Season = number | 'all';

export function seasons(data: Pick<AppData, 'evenings'>): number[] {
  const years = new Set(data.evenings.map((e) => Number(e.date.slice(0, 4))));
  return [...years].filter((y) => !Number.isNaN(y)).sort((a, b) => b - a);
}

/** Schränkt alle Daten auf die Abende einer Saison (Kalenderjahr) ein. */
export function scopeToSeason(data: AppData, season: Season): AppData {
  if (season === 'all') return data;
  const evenings = data.evenings.filter((e) => Number(e.date.slice(0, 4)) === season);
  const ids = new Set(evenings.map((e) => e.id));
  return {
    players: data.players,
    evenings,
    games: data.games.filter((g) => ids.has(g.eveningId)),
    rounds: data.rounds.filter((r) => ids.has(r.eveningId)),
    chritz: data.chritz.filter((c) => ids.has(c.eveningId)),
  };
}

export function teamOf(evening: Evening, playerId: string): TeamIndex | null {
  if (evening.teams[0].includes(playerId)) return 0;
  if (evening.teams[1].includes(playerId)) return 1;
  return null;
}

export function sortEveningsAsc(evenings: Evening[]): Evening[] {
  return [...evenings].sort((a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt));
}

function groupBy<T>(items: T[], key: (t: T) => string): Map<string, T[]> {
  const m = new Map<string, T[]>();
  for (const it of items) {
    const k = key(it);
    const arr = m.get(k);
    if (arr) arr.push(it);
    else m.set(k, [it]);
  }
  return m;
}

/** Chritz-Punkte pro Team an einem Abend (Sieg = 2). */
export function chritzPoints(chritz: Chritz[]): Pair {
  const p: Pair = [0, 0];
  for (const c of chritz) p[c.team] += CHRITZ_VALUE[c.type];
  return p;
}

// ─────────────────────────── Spieler ───────────────────────────

export interface PlayerStat {
  playerId: string;
  evenings: number;
  chritz: number;
  match: number;
  bergpreis: number;
  sieg: number;
  /** Entschiedene Partien (ein Sieg-Chritz pro Partie). */
  games: number;
  winRate: number | null;
  /** Abende, an denen das eigene Team mehr Chritz hatte. */
  eveningWins: number;
  rounds: number;
  points: number;
  avgPoints: number | null;
  weis: number;
}

export function playerStats(data: AppData): PlayerStat[] {
  const map = new Map<string, PlayerStat>();
  for (const p of data.players) {
    map.set(p.id, {
      playerId: p.id,
      evenings: 0,
      chritz: 0,
      match: 0,
      bergpreis: 0,
      sieg: 0,
      games: 0,
      winRate: null,
      eveningWins: 0,
      rounds: 0,
      points: 0,
      avgPoints: null,
      weis: 0,
    });
  }
  const chritzByEvening = groupBy(data.chritz, (c) => c.eveningId);
  const roundsByEvening = groupBy(data.rounds, (r) => r.eveningId);

  for (const ev of data.evenings) {
    const ch = chritzByEvening.get(ev.id) ?? [];
    const rounds = roundsByEvening.get(ev.id) ?? [];
    const cp = chritzPoints(ch);
    const decided = ch.filter((c) => c.type === 'sieg').length;
    for (const t of [0, 1] as TeamIndex[]) {
      for (const pid of ev.teams[t]) {
        const s = map.get(pid);
        if (!s) continue;
        s.evenings += 1;
        s.games += decided;
        if (cp[t] > cp[t === 0 ? 1 : 0]) s.eveningWins += 1;
        for (const c of ch) {
          if (c.team !== t) continue;
          s.chritz += CHRITZ_VALUE[c.type];
          s[c.type] += 1;
        }
        for (const r of rounds) {
          s.rounds += 1;
          s.points += roundPoints(r)[t];
          s.weis += weisPair(r)[t] * r.multiplier;
        }
      }
    }
  }
  for (const s of map.values()) {
    s.winRate = s.games > 0 ? s.sieg / s.games : null;
    s.avgPoints = s.rounds > 0 ? s.points / s.rounds : null;
  }
  return [...map.values()].sort((a, b) => b.chritz - a.chritz || b.sieg - a.sieg || b.evenings - a.evenings);
}

// ─────────────────────────── Duos & Paarungen ───────────────────────────

export const duoKey = (ids: string[]) => [...ids].sort().join('|');

export interface DuoStat {
  key: string;
  players: string[];
  evenings: number;
  chritz: number;
  games: number;
  wins: number;
  winRate: number | null;
  eveningWins: number;
}

export function duoStats(data: AppData): DuoStat[] {
  const map = new Map<string, DuoStat>();
  const chritzByEvening = groupBy(data.chritz, (c) => c.eveningId);
  for (const ev of data.evenings) {
    const ch = chritzByEvening.get(ev.id) ?? [];
    const cp = chritzPoints(ch);
    const decided = ch.filter((c) => c.type === 'sieg').length;
    for (const t of [0, 1] as TeamIndex[]) {
      const ids = ev.teams[t];
      if (ids.length < 2) continue;
      const key = duoKey(ids);
      let s = map.get(key);
      if (!s) {
        s = { key, players: [...ids].sort(), evenings: 0, chritz: 0, games: 0, wins: 0, winRate: null, eveningWins: 0 };
        map.set(key, s);
      }
      s.evenings += 1;
      s.chritz += cp[t];
      s.games += decided;
      s.wins += ch.filter((c) => c.type === 'sieg' && c.team === t).length;
      if (cp[t] > cp[t === 0 ? 1 : 0]) s.eveningWins += 1;
    }
  }
  for (const s of map.values()) s.winRate = s.games > 0 ? s.wins / s.games : null;
  return [...map.values()].sort(
    (a, b) => (b.winRate ?? -1) - (a.winRate ?? -1) || b.chritz / b.evenings - a.chritz / a.evenings,
  );
}

export interface HeadToHead {
  key: string;
  sides: [string[], string[]];
  evenings: number;
  wins: Pair;
  chritz: Pair;
  eveningWins: Pair;
}

export function headToHead(data: AppData): HeadToHead[] {
  const map = new Map<string, HeadToHead>();
  const chritzByEvening = groupBy(data.chritz, (c) => c.eveningId);
  for (const ev of data.evenings) {
    if (ev.teams[0].length < 2 || ev.teams[1].length < 2) continue;
    const k0 = duoKey(ev.teams[0]);
    const k1 = duoKey(ev.teams[1]);
    const flip = k0 > k1;
    const key = flip ? `${k1}#${k0}` : `${k0}#${k1}`;
    let h = map.get(key);
    if (!h) {
      const sides: [string[], string[]] = flip
        ? [[...ev.teams[1]].sort(), [...ev.teams[0]].sort()]
        : [[...ev.teams[0]].sort(), [...ev.teams[1]].sort()];
      h = { key, sides, evenings: 0, wins: [0, 0], chritz: [0, 0], eveningWins: [0, 0] };
      map.set(key, h);
    }
    const ch = chritzByEvening.get(ev.id) ?? [];
    const cp = chritzPoints(ch);
    const side = (t: TeamIndex): 0 | 1 => ((flip ? 1 - t : t) as 0 | 1);
    h.evenings += 1;
    for (const t of [0, 1] as TeamIndex[]) {
      h.chritz[side(t)] += cp[t];
      h.wins[side(t)] += ch.filter((c) => c.type === 'sieg' && c.team === t).length;
    }
    if (cp[0] !== cp[1]) h.eveningWins[side(cp[0] > cp[1] ? 0 : 1)] += 1;
  }
  return [...map.values()].sort((a, b) => b.evenings - a.evenings);
}

// ─────────────────────────── Serien ───────────────────────────

export interface GameResult {
  eveningId: string;
  date: string;
  winner: TeamIndex;
  teams: [string[], string[]];
}

/** Alle entschiedenen Partien in chronologischer Reihenfolge. */
export function gameResults(data: AppData): GameResult[] {
  const chritzByEvening = groupBy(data.chritz, (c) => c.eveningId);
  const out: GameResult[] = [];
  for (const ev of sortEveningsAsc(data.evenings)) {
    const wins = (chritzByEvening.get(ev.id) ?? [])
      .filter((c) => c.type === 'sieg')
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    for (const w of wins) out.push({ eveningId: ev.id, date: ev.date, winner: w.team, teams: ev.teams });
  }
  return out;
}

export interface StreakStat {
  playerId: string;
  longest: number;
  current: number;
  /** Positive Zahl = Siegesserie, negative = Niederlagenserie. */
  form: ('W' | 'L')[];
}

export function streaks(data: AppData): StreakStat[] {
  const results = gameResults(data);
  return data.players.map((p) => {
    let longest = 0;
    let run = 0;
    const form: ('W' | 'L')[] = [];
    for (const g of results) {
      const t = g.teams[0].includes(p.id) ? 0 : g.teams[1].includes(p.id) ? 1 : null;
      if (t === null) continue;
      const won = g.winner === t;
      form.push(won ? 'W' : 'L');
      run = won ? run + 1 : 0;
      longest = Math.max(longest, run);
    }
    return { playerId: p.id, longest, current: run, form: form.slice(-8) };
  });
}

// ─────────────────────────── Verlauf ───────────────────────────

export interface TimelinePoint {
  eveningId: string;
  date: string;
  [playerId: string]: number | string;
}

/** Kumulierte Chritz pro Spieler nach jedem Abend. */
export function chritzTimeline(data: AppData): TimelinePoint[] {
  const chritzByEvening = groupBy(data.chritz, (c) => c.eveningId);
  const acc = new Map<string, number>(data.players.map((p) => [p.id, 0]));
  return sortEveningsAsc(data.evenings).map((ev) => {
    const cp = chritzPoints(chritzByEvening.get(ev.id) ?? []);
    for (const t of [0, 1] as TeamIndex[]) {
      for (const pid of ev.teams[t]) acc.set(pid, (acc.get(pid) ?? 0) + cp[t]);
    }
    const point: TimelinePoint = { eveningId: ev.id, date: ev.date };
    for (const [pid, v] of acc) point[pid] = v;
    return point;
  });
}

// ─────────────────────────── Rekorde ───────────────────────────

export interface Record_ {
  label: string;
  value: string;
  team: string[];
  eveningId: string;
  date: string;
}

export interface Records {
  highestRound: Record_ | null;
  biggestWeis: Record_ | null;
  fastestWin: Record_ | null;
  biggestWin: Record_ | null;
  closestWin: Record_ | null;
  mostChritzEvening: Record_ | null;
  mostMatchesEvening: Record_ | null;
}

export function records(data: AppData): Records {
  const evById = new Map(data.evenings.map((e) => [e.id, e]));
  const out: Records = {
    highestRound: null,
    biggestWeis: null,
    fastestWin: null,
    biggestWin: null,
    closestWin: null,
    mostChritzEvening: null,
    mostMatchesEvening: null,
  };

  let best = -1;
  let bestWeis = 0;
  for (const r of data.rounds) {
    const ev = evById.get(r.eveningId);
    if (!ev) continue;
    const p = roundPoints(r);
    const w = weisPair(r);
    for (const t of [0, 1] as TeamIndex[]) {
      if (p[t] > best) {
        best = p[t];
        out.highestRound = { label: 'Höchste Runde', value: `${p[t]} Pkt`, team: ev.teams[t], eveningId: ev.id, date: ev.date };
      }
      const wm = w[t] * r.multiplier;
      if (wm > bestWeis) {
        bestWeis = wm;
        out.biggestWeis = { label: 'Höchster Weis', value: `${wm} Pkt`, team: ev.teams[t], eveningId: ev.id, date: ev.date };
      }
    }
  }

  const sieg = data.chritz.filter((c) => c.type === 'sieg' && c.gameId);
  let fastest = Infinity;
  let biggest = -1;
  let closest = Infinity;
  for (const c of sieg) {
    const ev = evById.get(c.eveningId);
    if (!ev) continue;
    const rounds = roundsOfGame(data, c.gameId!);
    if (rounds.length === 0) continue;
    // Nur Runden bis und mit der Sieg-Runde zählen.
    const idx = c.roundId ? rounds.findIndex((r) => r.id === c.roundId) : rounds.length - 1;
    const upTo = rounds.slice(0, (idx < 0 ? rounds.length - 1 : idx) + 1);
    const t = totals(upTo);
    const margin = t[c.team] - t[c.team === 0 ? 1 : 0];
    const n = upTo.filter((r) => r.stichTeam !== null || r.matchTeam !== null).length;
    const team = ev.teams[c.team];
    if (n > 0 && n < fastest) {
      fastest = n;
      out.fastestWin = { label: 'Schnellster Sieg', value: `${n} Runden`, team, eveningId: ev.id, date: ev.date };
    }
    if (margin > biggest) {
      biggest = margin;
      out.biggestWin = { label: 'Höchster Sieg', value: `+${margin}`, team, eveningId: ev.id, date: ev.date };
    }
    if (margin >= 0 && margin < closest) {
      closest = margin;
      out.closestWin = { label: 'Knappster Sieg', value: `+${margin}`, team, eveningId: ev.id, date: ev.date };
    }
  }

  if (sieg.length < 2) out.closestWin = null;

  const chritzByEvening = groupBy(data.chritz, (c) => c.eveningId);
  let mostCh = 0;
  let mostMatch = 0;
  for (const ev of data.evenings) {
    const ch = chritzByEvening.get(ev.id) ?? [];
    const cp = chritzPoints(ch);
    for (const t of [0, 1] as TeamIndex[]) {
      if (cp[t] > mostCh) {
        mostCh = cp[t];
        out.mostChritzEvening = { label: 'Meiste Chritz an einem Abend', value: `${cp[t]}`, team: ev.teams[t], eveningId: ev.id, date: ev.date };
      }
      const m = ch.filter((c) => c.type === 'match' && c.team === t).length;
      if (m > mostMatch) {
        mostMatch = m;
        out.mostMatchesEvening = { label: 'Meiste Matches an einem Abend', value: `${m}`, team: ev.teams[t], eveningId: ev.id, date: ev.date };
      }
    }
  }
  return out;
}

// ─────────────────────────── Abend-Rückblick ───────────────────────────

export interface GameSummary {
  game: Game;
  rounds: Round[];
  totals: Pair;
  winner: TeamIndex | null;
  matches: Pair;
  weis: Pair;
  highest: { points: number; team: TeamIndex } | null;
  series: { n: number; a: number; b: number }[];
}

export function gameSummary(data: AppData, game: Game): GameSummary {
  const rounds = roundsOfGame(data, game.id);
  const steps = progression(rounds);
  const matches: Pair = [0, 0];
  const weis: Pair = [0, 0];
  let highest: GameSummary['highest'] = null;
  for (const s of steps) {
    if (s.round.matchTeam !== null) matches[s.round.matchTeam] += 1;
    const w = weisPair(s.round);
    weis[0] += w[0] * s.round.multiplier;
    weis[1] += w[1] * s.round.multiplier;
    for (const t of [0, 1] as TeamIndex[]) {
      if (!highest || s.points[t] > highest.points) highest = { points: s.points[t], team: t };
    }
  }
  const win = data.chritz.find((c) => c.gameId === game.id && c.type === 'sieg');
  return {
    game,
    rounds,
    totals: steps.length ? steps[steps.length - 1].after : [0, 0],
    winner: win ? win.team : null,
    matches,
    weis,
    highest,
    series: [{ n: 0, a: 0, b: 0 }, ...steps.map((s, i) => ({ n: i + 1, a: s.after[0], b: s.after[1] }))],
  };
}

export interface EveningSummary {
  evening: Evening;
  chritz: Chritz[];
  points: Pair;
  byType: [Record<ChritzType, number>, Record<ChritzType, number>];
  games: GameSummary[];
  rounds: number;
}

export function eveningSummary(data: AppData, eveningId: string): EveningSummary | null {
  const evening = data.evenings.find((e) => e.id === eveningId);
  if (!evening) return null;
  const chritz = data.chritz.filter((c) => c.eveningId === eveningId);
  const byType: EveningSummary['byType'] = [
    { match: 0, bergpreis: 0, sieg: 0 },
    { match: 0, bergpreis: 0, sieg: 0 },
  ];
  for (const c of chritz) byType[c.team][c.type] += 1;
  return {
    evening,
    chritz,
    points: chritzPoints(chritz),
    byType,
    games: gamesOfEvening(data, eveningId).map((g) => gameSummary(data, g)),
    rounds: data.rounds.filter((r) => r.eveningId === eveningId).length,
  };
}

export function hasPointData(data: AppData): boolean {
  return data.rounds.length > 0;
}


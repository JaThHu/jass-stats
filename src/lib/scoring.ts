import {
  BERGPREIS_POINTS,
  MATCH_POINTS,
  SIEG_POINTS,
  STICH_TOTAL,
  STOECK_POINTS,
  type AppData,
  type Chritz,
  type ChritzType,
  type Game,
  type Round,
  type TeamIndex,
} from './types';

export type Pair = [number, number];

export const other = (t: TeamIndex): TeamIndex => (t === 0 ? 1 : 0);

/** Stichpunkte (ohne Weis) pro Team, vor Multiplikator. */
export function stichPair(r: Pick<Round, 'stichTeam' | 'stichPoints' | 'matchTeam'>): Pair {
  if (r.matchTeam !== null) {
    return r.matchTeam === 0 ? [MATCH_POINTS, 0] : [0, MATCH_POINTS];
  }
  if (r.stichTeam === null || r.stichPoints === null) return [0, 0];
  const mine = r.stichPoints;
  const theirs = Math.max(0, STICH_TOTAL - mine);
  return r.stichTeam === 0 ? [mine, theirs] : [theirs, mine];
}

/** Weis + Stöck pro Team, vor Multiplikator. */
export function weisPair(r: Pick<Round, 'weis' | 'stoeck'>): Pair {
  return [
    r.weis[0] + (r.stoeck[0] ? STOECK_POINTS : 0),
    r.weis[1] + (r.stoeck[1] ? STOECK_POINTS : 0),
  ];
}

/** Gutgeschriebene Punkte pro Team für eine Runde (inkl. Multiplikator). */
export function roundPoints(
  r: Pick<Round, 'stichTeam' | 'stichPoints' | 'matchTeam' | 'weis' | 'stoeck' | 'multiplier'>,
): Pair {
  const s = stichPair(r);
  const w = weisPair(r);
  return [(s[0] + w[0]) * r.multiplier, (s[1] + w[1]) * r.multiplier];
}

export function isWeisOnly(r: Pick<Round, 'stichTeam' | 'stichPoints' | 'matchTeam'>): boolean {
  return r.matchTeam === null && (r.stichTeam === null || r.stichPoints === null);
}

/** Gespielte Runde (Stich oder Match). Reine Weis-Einträge zählen nicht als Runde. */
export function isPlayedRound(r: Pick<Round, 'stichTeam' | 'stichPoints' | 'matchTeam'>): boolean {
  return !isWeisOnly(r);
}

/** Stichpunkte inkl. Multiplikator, ohne Weis. */
export function stichPoints(r: Pick<Round, 'stichTeam' | 'stichPoints' | 'matchTeam' | 'multiplier'>): Pair {
  const s = stichPair(r);
  return [s[0] * r.multiplier, s[1] * r.multiplier];
}

export function compareRounds(a: Round, b: Round): number {
  return a.seq - b.seq || a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id);
}

export function roundsOfGame(data: Pick<AppData, 'rounds'>, gameId: string): Round[] {
  return data.rounds.filter((r) => r.gameId === gameId).sort(compareRounds);
}

export function gamesOfEvening(data: Pick<AppData, 'games'>, eveningId: string): Game[] {
  return data.games
    .filter((g) => g.eveningId === eveningId)
    .sort((a, b) => a.number - b.number || a.createdAt.localeCompare(b.createdAt));
}

export function totals(rounds: Round[]): Pair {
  const t: Pair = [0, 0];
  for (const r of rounds) {
    const p = roundPoints(r);
    t[0] += p[0];
    t[1] += p[1];
  }
  return t;
}

export interface RoundStep {
  round: Round;
  points: Pair;
  before: Pair;
  after: Pair;
}

export function progression(rounds: Round[]): RoundStep[] {
  const out: RoundStep[] = [];
  let acc: Pair = [0, 0];
  for (const round of rounds) {
    const points = roundPoints(round);
    const after: Pair = [acc[0] + points[0], acc[1] + points[1]];
    out.push({ round, points, before: acc, after });
    acc = after;
  }
  return out;
}

// ─────────────────────────── Chritz-Erkennung ───────────────────────────

export interface ChritzEvent {
  key: string;
  type: ChritzType;
  roundId: string;
  /** Teams, die den Chritz bekommen könnten. Zwei Einträge = App muss nachfragen. */
  candidates: TeamIndex[];
}

export const eventKey = (type: ChritzType, roundId: string | null) => `${type}:${roundId ?? ''}`;

const TYPE_ORDER: Record<ChritzType, number> = { match: 0, bergpreis: 1, sieg: 2 };

/**
 * Findet alle Chritz, die sich aus den Runden einer Partie ergeben:
 * jeder Match, das erste Team über 1500 (Bergpreis) und über 2500 (Sieg).
 */
export function detectEvents(rounds: Round[]): ChritzEvent[] {
  const events: ChritzEvent[] = [];
  const steps = progression(rounds);
  const thresholds: [ChritzType, number][] = [
    ['bergpreis', BERGPREIS_POINTS],
    ['sieg', SIEG_POINTS],
  ];
  const found = new Set<ChritzType>();

  for (const step of steps) {
    const { round } = step;
    if (round.matchTeam !== null) {
      events.push({
        key: eventKey('match', round.id),
        type: 'match',
        roundId: round.id,
        candidates: [round.matchTeam],
      });
    }
    for (const [type, limit] of thresholds) {
      if (found.has(type)) continue;
      const crossed = ([0, 1] as TeamIndex[]).filter(
        (t) => step.before[t] < limit && step.after[t] >= limit,
      );
      if (crossed.length > 0) {
        found.add(type);
        events.push({ key: eventKey(type, round.id), type, roundId: round.id, candidates: crossed });
      }
    }
  }
  return events;
}

/**
 * Entfernt automatische Chritz einer Partie, die nach einer Änderung an den
 * Runden nicht mehr stimmen (z. B. Runde gelöscht oder Punkte korrigiert).
 */
export function reconcileGame(data: AppData, gameId: string): AppData {
  const events = new Map(detectEvents(roundsOfGame(data, gameId)).map((e) => [e.key, e]));
  const seen = new Set<string>();
  let changed = false;
  const chritz = data.chritz.filter((c) => {
    if (c.gameId !== gameId || !c.auto) return true;
    const key = eventKey(c.type, c.roundId);
    const ev = events.get(key);
    const ok = !!ev && ev.candidates.includes(c.team) && !seen.has(key);
    seen.add(key);
    if (!ok) changed = true;
    return ok;
  });

  let games = data.games;
  const game = data.games.find((g) => g.id === gameId);
  if (game) {
    const dismissed = game.dismissed.filter((k) => events.has(k));
    if (dismissed.length !== game.dismissed.length) {
      games = data.games.map((g) => (g.id === gameId ? { ...g, dismissed } : g));
      changed = true;
    }
  }
  return changed ? { ...data, chritz, games } : data;
}

/** Erkannte Chritz, die noch weder bestätigt noch abgelehnt wurden. */
export function pendingEvents(data: AppData, gameId: string): ChritzEvent[] {
  const game = data.games.find((g) => g.id === gameId);
  if (!game) return [];
  const rounds = roundsOfGame(data, gameId);
  const resolved = new Set(
    data.chritz.filter((c) => c.gameId === gameId && c.auto).map((c) => eventKey(c.type, c.roundId)),
  );
  const order = new Map(rounds.map((r, i) => [r.id, i]));
  return detectEvents(rounds)
    .filter((e) => !resolved.has(e.key) && !game.dismissed.includes(e.key))
    .sort(
      (a, b) =>
        (order.get(a.roundId) ?? 0) - (order.get(b.roundId) ?? 0) ||
        TYPE_ORDER[a.type] - TYPE_ORDER[b.type],
    );
}

/** Sieger einer Partie = Team mit dem Sieg-Chritz dieser Partie. */
export function gameWinner(data: Pick<AppData, 'chritz'>, gameId: string): TeamIndex | null {
  const c = data.chritz.find((x) => x.gameId === gameId && x.type === 'sieg');
  return c ? c.team : null;
}

export function chritzOfEvening(data: Pick<AppData, 'chritz'>, eveningId: string): Chritz[] {
  return data.chritz
    .filter((c) => c.eveningId === eveningId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

// ─────────────────────────── Tafel-Darstellung ───────────────────────────

export interface TallySplit {
  s100: number;
  s50: number;
  s20: number;
  rest: number;
}

/** Zerlegt ein Total in Striche (100er/50er/20er) und Rest, wie auf der Kreidetafel. */
export function splitTally(total: number): TallySplit {
  const t = Math.max(0, Math.round(total));
  const s100 = Math.floor(t / 100);
  const r1 = t % 100;
  const s50 = Math.floor(r1 / 50);
  const r2 = r1 % 50;
  const s20 = Math.floor(r2 / 20);
  return { s100, s50, s20, rest: r2 % 20 };
}

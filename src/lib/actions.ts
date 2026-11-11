/**
 * Reine Daten-Operationen: (AppData, …) → AppData.
 * Die Synchronisierung (lokal / Supabase) passiert separat über einen Diff.
 */
import { newId, nowIso } from './ids';
import { eventKey, gamesOfEvening, reconcileGame, roundsOfGame, type ChritzEvent } from './scoring';
import type { AppData, Chritz, ChritzType, Evening, Game, Round, TeamIndex, TableName } from './types';
import { TABLES } from './types';

// ─────────────── Spieler ───────────────

export function addPlayer(d: AppData, name: string): AppData {
  return { ...d, players: [...d.players, { id: newId(), name: name.trim(), createdAt: nowIso() }] };
}

export function renamePlayer(d: AppData, id: string, name: string): AppData {
  return { ...d, players: d.players.map((p) => (p.id === id ? { ...p, name: name.trim() } : p)) };
}

export function playerHasEvenings(d: AppData, id: string): boolean {
  return d.evenings.some((e) => e.teams[0].includes(id) || e.teams[1].includes(id));
}

export function deletePlayer(d: AppData, id: string): AppData {
  if (playerHasEvenings(d, id)) return d;
  return { ...d, players: d.players.filter((p) => p.id !== id) };
}

// ─────────────── Abende & Partien ───────────────

export function activeEvening(d: AppData): Evening | null {
  return (
    [...d.evenings]
      .filter((e) => e.status === 'active')
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0] ?? null
  );
}

export function currentGame(d: AppData, eveningId: string): Game | null {
  const games = gamesOfEvening(d, eveningId);
  return games[games.length - 1] ?? null;
}

export function startEvening(d: AppData, teams: [string[], string[]], date: string): AppData {
  const evening: Evening = {
    id: newId(),
    date,
    teams: [[...teams[0]], [...teams[1]]],
    status: 'active',
    notes: null,
    createdAt: nowIso(),
  };
  const game: Game = { id: newId(), eveningId: evening.id, number: 1, dismissed: [], createdAt: nowIso() };
  return { ...d, evenings: [...d.evenings, evening], games: [...d.games, game] };
}

export function startGame(d: AppData, eveningId: string): AppData {
  const games = gamesOfEvening(d, eveningId);
  const last = games[games.length - 1];
  // Leere Partie nicht doppelt anlegen.
  if (last && !d.rounds.some((r) => r.gameId === last.id)) return d;
  const game: Game = {
    id: newId(),
    eveningId,
    number: (last?.number ?? 0) + 1,
    dismissed: [],
    createdAt: nowIso(),
  };
  return { ...d, games: [...d.games, game] };
}

/** Beendet den Abend. Leere, angefangene Partien werden entfernt. */
export function endEvening(d: AppData, eveningId: string): AppData {
  const emptyGames = new Set(
    d.games.filter((g) => g.eveningId === eveningId && !d.rounds.some((r) => r.gameId === g.id)).map((g) => g.id),
  );
  return {
    ...d,
    evenings: d.evenings.map((e) => (e.id === eveningId ? { ...e, status: 'done' } : e)),
    games: d.games.filter((g) => !emptyGames.has(g.id)),
  };
}

export function reopenEvening(d: AppData, eveningId: string): AppData {
  let next: AppData = {
    ...d,
    evenings: d.evenings.map((e) => (e.id === eveningId ? { ...e, status: 'active' } : e)),
  };
  if (!currentGame(next, eveningId)) next = startGame(next, eveningId);
  return next;
}

export function updateEvening(d: AppData, evening: Evening): AppData {
  return { ...d, evenings: d.evenings.map((e) => (e.id === evening.id ? evening : e)) };
}

export function deleteEvening(d: AppData, eveningId: string): AppData {
  return {
    ...d,
    evenings: d.evenings.filter((e) => e.id !== eveningId),
    games: d.games.filter((g) => g.eveningId !== eveningId),
    rounds: d.rounds.filter((r) => r.eveningId !== eveningId),
    chritz: d.chritz.filter((c) => c.eveningId !== eveningId),
  };
}

/** Abend nachträglich erfassen (nur Chritz, ohne Tafel). */
export function addPastEvening(
  d: AppData,
  input: { date: string; teams: [string[], string[]]; chritz: { type: ChritzType; team: TeamIndex }[] },
): AppData {
  const eveningId = newId();
  const base = Date.now();
  const evening: Evening = {
    id: eveningId,
    date: input.date,
    teams: input.teams,
    status: 'done',
    notes: null,
    createdAt: new Date(base).toISOString(),
  };
  const chritz: Chritz[] = input.chritz.map((c, i) => ({
    id: newId(),
    eveningId,
    gameId: null,
    roundId: null,
    type: c.type,
    team: c.team,
    auto: false,
    createdAt: new Date(base + i + 1).toISOString(),
  }));
  return { ...d, evenings: [...d.evenings, evening], chritz: [...d.chritz, ...chritz] };
}

// ─────────────── Runden ───────────────

export type RoundInput = Pick<
  Round,
  'multiplier' | 'stichTeam' | 'stichPoints' | 'matchTeam' | 'weis' | 'stoeck'
>;

export function addRound(d: AppData, gameId: string, input: RoundInput): AppData {
  const game = d.games.find((g) => g.id === gameId);
  if (!game) return d;
  const rounds = roundsOfGame(d, gameId);
  const round: Round = {
    ...input,
    id: newId(),
    gameId,
    eveningId: game.eveningId,
    seq: (rounds[rounds.length - 1]?.seq ?? 0) + 1,
    createdAt: nowIso(),
  };
  return reconcileGame({ ...d, rounds: [...d.rounds, round] }, gameId);
}

export function updateRound(d: AppData, round: Round): AppData {
  return reconcileGame({ ...d, rounds: d.rounds.map((r) => (r.id === round.id ? round : r)) }, round.gameId);
}

export function deleteRound(d: AppData, roundId: string): AppData {
  const round = d.rounds.find((r) => r.id === roundId);
  if (!round) return d;
  return reconcileGame({ ...d, rounds: d.rounds.filter((r) => r.id !== roundId) }, round.gameId);
}

// ─────────────── Chritz ───────────────

/** Bestätigt (team) oder verwirft (null) einen automatisch erkannten Chritz. */
export function resolveEvent(d: AppData, gameId: string, ev: ChritzEvent, team: TeamIndex | null): AppData {
  const game = d.games.find((g) => g.id === gameId);
  if (!game) return d;
  if (team === null) {
    if (game.dismissed.includes(ev.key)) return d;
    return { ...d, games: d.games.map((g) => (g.id === gameId ? { ...g, dismissed: [...g.dismissed, ev.key] } : g)) };
  }
  if (d.chritz.some((c) => c.gameId === gameId && c.auto && eventKey(c.type, c.roundId) === ev.key)) return d;
  const chritz: Chritz = {
    id: newId(),
    eveningId: game.eveningId,
    gameId,
    roundId: ev.roundId,
    type: ev.type,
    team,
    auto: true,
    createdAt: nowIso(),
  };
  return { ...d, chritz: [...d.chritz, chritz] };
}

export function addChritz(d: AppData, eveningId: string, type: ChritzType, team: TeamIndex): AppData {
  const chritz: Chritz = {
    id: newId(),
    eveningId,
    gameId: null,
    roundId: null,
    type,
    team,
    auto: false,
    createdAt: nowIso(),
  };
  return { ...d, chritz: [...d.chritz, chritz] };
}

export function removeChritz(d: AppData, id: string): AppData {
  return { ...d, chritz: d.chritz.filter((c) => c.id !== id) };
}

// ─────────────── Import ───────────────

/** Führt importierte Daten mit den bestehenden zusammen (gleiche ID = überschreiben). */
export function mergeData(d: AppData, incoming: AppData): AppData {
  const out = { ...d };
  for (const t of TABLES) {
    const map = new Map<string, unknown>((d[t] as { id: string }[]).map((x) => [x.id, x]));
    for (const x of incoming[t] as { id: string }[]) map.set(x.id, x);
    (out as Record<TableName, unknown[]>)[t] = [...map.values()];
  }
  return out;
}

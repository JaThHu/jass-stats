import type { AppData, Chritz, ChritzType, Evening, Game, Player, Round, TeamIndex } from './types';

/** Format der alten App-Version (nur localStorage). */
interface LegacyData {
  players: { id: string; name: string; createdAt: string }[];
  sessions: {
    id: string;
    date: string;
    teams: [string[], string[]];
    chritz: { id: string; type: ChritzType; teamIndex: TeamIndex }[];
    notes?: string;
  }[];
}

export const LEGACY_KEY = 'jass-stats-data';

function isLegacy(x: unknown): x is LegacyData {
  const d = x as LegacyData;
  return !!d && Array.isArray(d.players) && Array.isArray(d.sessions);
}

function isCurrent(x: unknown): x is AppData {
  const d = x as AppData;
  return (
    !!d &&
    Array.isArray(d.players) &&
    Array.isArray(d.evenings) &&
    Array.isArray(d.games) &&
    Array.isArray(d.rounds) &&
    Array.isArray(d.chritz)
  );
}

export function convertLegacy(old: LegacyData): AppData {
  const players: Player[] = old.players.map((p) => ({
    id: p.id,
    name: p.name,
    createdAt: p.createdAt || new Date(0).toISOString(),
  }));
  const evenings: Evening[] = [];
  const chritz: Chritz[] = [];
  for (const s of old.sessions) {
    const base = new Date(`${s.date}T20:00:00`).getTime() || Date.now();
    evenings.push({
      id: s.id,
      date: s.date,
      teams: [[...s.teams[0]], [...s.teams[1]]],
      status: 'done',
      notes: s.notes ?? null,
      createdAt: new Date(base).toISOString(),
    });
    s.chritz.forEach((c, i) => {
      chritz.push({
        id: c.id,
        eveningId: s.id,
        gameId: null,
        roundId: null,
        type: c.type,
        team: c.teamIndex,
        auto: false,
        createdAt: new Date(base + (i + 1) * 1000).toISOString(),
      });
    });
  }
  return { players, evenings, games: [], rounds: [], chritz };
}

/** Akzeptiert sowohl das alte als auch das neue Exportformat. */
export function parseImport(raw: unknown): AppData {
  if (isCurrent(raw)) {
    return {
      players: raw.players as Player[],
      evenings: raw.evenings as Evening[],
      games: raw.games as Game[],
      rounds: raw.rounds as Round[],
      chritz: raw.chritz as Chritz[],
    };
  }
  if (isLegacy(raw)) return convertLegacy(raw);
  throw new Error('Ungültiges Dateiformat');
}

export function readLegacyLocal(): AppData | null {
  try {
    const raw = localStorage.getItem(LEGACY_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return isLegacy(parsed) ? convertLegacy(parsed) : null;
  } catch {
    return null;
  }
}

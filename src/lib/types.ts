export type TeamIndex = 0 | 1;
export type ChritzType = 'match' | 'bergpreis' | 'sieg';

export const CHRITZ_TYPES: ChritzType[] = ['match', 'bergpreis', 'sieg'];

export const CHRITZ_LABELS: Record<ChritzType, string> = {
  match: 'Match',
  bergpreis: 'Bergpreis',
  sieg: 'Sieg',
};

export const CHRITZ_ICONS: Record<ChritzType, string> = {
  match: '⚡',
  bergpreis: '🏔️',
  sieg: '🏆',
};

/** Wie viele Chritz ein Eintrag wert ist (Sieg = 2). */
export const CHRITZ_VALUE: Record<ChritzType, number> = {
  match: 1,
  bergpreis: 1,
  sieg: 2,
};

export const BERGPREIS_POINTS = 1500;
export const SIEG_POINTS = 2500;
export const STICH_TOTAL = 157;
export const MATCH_POINTS = 257;
export const STOECK_POINTS = 20;
export const MULTIPLIERS = [1, 2, 3] as const;

export interface Player {
  id: string;
  name: string;
  createdAt: string;
}

/** Ein Jassabend. Teams bleiben für den ganzen Abend gleich. */
export interface Evening {
  id: string;
  date: string; // YYYY-MM-DD
  teams: [string[], string[]];
  status: 'active' | 'done';
  notes: string | null;
  createdAt: string;
}

/** Eine Partie (bis 2500) innerhalb eines Abends. */
export interface Game {
  id: string;
  eveningId: string;
  number: number;
  /** Abgelehnte automatische Chritz-Vorschläge (Event-Keys). */
  dismissed: string[];
  createdAt: string;
}

/**
 * Eine Runde auf der Tafel.
 * - stichTeam/stichPoints: die eingetippten Stichpunkte (0–157) eines Teams;
 *   das andere Team erhält 157 − x. Beide null = nur Weis/Stöck.
 * - matchTeam: Team mit Match (257), überschreibt die Stichpunkte.
 * - weis/stoeck: pro Team, vor Multiplikator.
 */
export interface Round {
  id: string;
  gameId: string;
  eveningId: string;
  seq: number;
  multiplier: number;
  stichTeam: TeamIndex | null;
  stichPoints: number | null;
  matchTeam: TeamIndex | null;
  weis: [number, number];
  stoeck: [boolean, boolean];
  createdAt: string;
}

export interface Chritz {
  id: string;
  eveningId: string;
  gameId: string | null;
  /** Bei automatisch erkannten Chritz: die auslösende Runde. */
  roundId: string | null;
  type: ChritzType;
  team: TeamIndex;
  auto: boolean;
  createdAt: string;
}

export interface AppData {
  players: Player[];
  evenings: Evening[];
  games: Game[];
  rounds: Round[];
  chritz: Chritz[];
}

export const EMPTY_DATA: AppData = {
  players: [],
  evenings: [],
  games: [],
  rounds: [],
  chritz: [],
};

export const TABLES = ['players', 'evenings', 'games', 'rounds', 'chritz'] as const;
export type TableName = (typeof TABLES)[number];

export type ChritzType = 'match' | 'bergpreis' | 'sieg';

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

export interface Player {
  id: string;
  name: string;
  createdAt: string;
}

export interface ChritzEntry {
  id: string;
  type: ChritzType;
  teamIndex: 0 | 1; // which team got this Chritz
}

export interface Session {
  id: string;
  date: string; // ISO date string YYYY-MM-DD
  teams: [string[], string[]]; // teams[0] = playerIds of team 0, teams[1] = playerIds of team 1
  chritz: ChritzEntry[];
  notes?: string;
}

export interface AppData {
  players: Player[];
  sessions: Session[];
}

// Computed stats for a player
export interface PlayerStats {
  playerId: string;
  total: number;
  match: number;
  bergpreis: number;
  sieg: number;
  sessions: number; // how many sessions they participated in
}

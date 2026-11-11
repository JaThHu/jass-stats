import type { AppData, Evening, Player } from './types';

export type Teams = [string[], string[]];

/** Die drei möglichen Paarungen für vier Spieler. */
export function pairingsFor(ids: string[]): Teams[] {
  const [p0, p1, p2, p3] = ids;
  return [
    [[p0, p1], [p2, p3]],
    [[p0, p2], [p1, p3]],
    [[p0, p3], [p1, p2]],
  ];
}

const sameSet = (a: string[], b: string[]) => a.length === b.length && a.every((id) => b.includes(id));

export function samePairing(a: Teams, b: Teams): boolean {
  return (sameSet(a[0], b[0]) && sameSet(a[1], b[1])) || (sameSet(a[0], b[1]) && sameSet(a[1], b[0]));
}

export function sortEveningsDesc(evenings: Evening[]): Evening[] {
  return [...evenings].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
}

export interface RotationInfo {
  players: Player[];
  pairings: Teams[];
  lastIndex: number;
  nextIndex: number;
}

/** Rotation A → B → C über die ersten vier Spieler (nach Erfassungsdatum). */
export function rotationInfo(data: Pick<AppData, 'players' | 'evenings'>): RotationInfo | null {
  const players = [...data.players].sort((a, b) => a.createdAt.localeCompare(b.createdAt)).slice(0, 4);
  if (players.length < 4) return null;
  const pairings = pairingsFor(players.map((p) => p.id));
  let lastIndex = -1;
  for (const ev of sortEveningsDesc(data.evenings)) {
    const idx = pairings.findIndex((p) => samePairing(p, ev.teams));
    if (idx >= 0) {
      lastIndex = idx;
      break;
    }
  }
  return { players, pairings, lastIndex, nextIndex: (lastIndex + 1) % 3 };
}

export const PAIRING_LABELS = ['A', 'B', 'C'];

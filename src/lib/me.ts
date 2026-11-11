import type { AppData, Evening, TeamIndex } from './types';

/** Welcher Spieler dieses Gerät benutzt (pro Gerät gespeichert, nicht in der Cloud). */
const ME_KEY = 'jass-stats-me';
const DEFAULT_NAME = /^janick\b/i;

export function storedMe(): string | null {
  try {
    return localStorage.getItem(ME_KEY);
  } catch {
    return null;
  }
}

export function setMe(id: string | null) {
  try {
    if (id) localStorage.setItem(ME_KEY, id);
    else localStorage.removeItem(ME_KEY);
  } catch {
    /* ignore */
  }
}

/** Gespeicherter Spieler oder – falls nichts gewählt – Janick. */
export function resolveMe(data: Pick<AppData, 'players'>): string | null {
  const stored = storedMe();
  if (stored && data.players.some((p) => p.id === stored)) return stored;
  return data.players.find((p) => DEFAULT_NAME.test(p.name.trim()))?.id ?? null;
}

/** Das Team, das auf der Tafel unten (auf meiner Seite) steht. */
export function myTeam(evening: Evening, me: string | null): TeamIndex {
  if (me && evening.teams[1].includes(me)) return 1;
  return 0;
}

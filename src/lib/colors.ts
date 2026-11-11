import type { AppData } from './types';

/** Kategoriale Palette (Dark Mode), validiert für CVD-Unterscheidbarkeit. Farbe folgt dem Spieler, nicht dem Rang. */
export const SERIES_COLORS = ['#3987e5', '#d95926', '#199e70', '#c98500', '#d55181', '#008300', '#9085e9', '#e66767'];

export const TEAM_COLORS = ['#3987e5', '#d95926'] as const;

export function playerColor(data: Pick<AppData, 'players'>, id: string): string {
  const sorted = [...data.players].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const idx = sorted.findIndex((p) => p.id === id);
  return idx < 0 ? '#6f7c77' : SERIES_COLORS[idx % SERIES_COLORS.length];
}

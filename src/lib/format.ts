import type { AppData } from './types';

export function formatDate(date: string, style: 'long' | 'short' | 'tiny' = 'long'): string {
  const d = new Date(`${date}T12:00:00`);
  if (style === 'tiny') return d.toLocaleDateString('de-CH', { day: 'numeric', month: 'short' });
  if (style === 'short') return d.toLocaleDateString('de-CH', { day: 'numeric', month: 'short', year: '2-digit' });
  return d.toLocaleDateString('de-CH', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' });
}

export function nameOf(data: Pick<AppData, 'players'>, id: string): string {
  return data.players.find((p) => p.id === id)?.name ?? '?';
}

export function teamName(data: Pick<AppData, 'players'>, ids: string[]): string {
  return ids.map((id) => nameOf(data, id)).join(' & ');
}

export function pct(x: number | null): string {
  return x === null ? '–' : `${Math.round(x * 100)}%`;
}

export function num(x: number): string {
  return x.toLocaleString('de-CH');
}

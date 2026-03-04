import type { AppData, Player, Session, PlayerStats, ChritzType } from './types';

const STORAGE_KEY = 'jass-stats-data';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { players: [], sessions: [] };
    return JSON.parse(raw) as AppData;
  } catch {
    return { players: [], sessions: [] };
  }
}

export function saveData(data: AppData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// Players
export function addPlayer(data: AppData, name: string): AppData {
  const player: Player = {
    id: generateId(),
    name: name.trim(),
    createdAt: new Date().toISOString(),
  };
  return { ...data, players: [...data.players, player] };
}

export function updatePlayer(data: AppData, id: string, name: string): AppData {
  return {
    ...data,
    players: data.players.map((p) => (p.id === id ? { ...p, name: name.trim() } : p)),
  };
}

export function deletePlayer(data: AppData, id: string): AppData {
  return {
    ...data,
    players: data.players.filter((p) => p.id !== id),
  };
}

// Sessions
export function addSession(data: AppData, session: Omit<Session, 'id'>): AppData {
  const newSession: Session = { ...session, id: generateId() };
  return { ...data, sessions: [newSession, ...data.sessions] };
}

export function updateSession(data: AppData, session: Session): AppData {
  return {
    ...data,
    sessions: data.sessions.map((s) => (s.id === session.id ? session : s)),
  };
}

export function deleteSession(data: AppData, id: string): AppData {
  return { ...data, sessions: data.sessions.filter((s) => s.id !== id) };
}

// Stats computation
export function computePlayerStats(
  data: AppData,
  filterFrom?: string,
  filterTo?: string
): PlayerStats[] {
  const filteredSessions = data.sessions.filter((s) => {
    if (filterFrom && s.date < filterFrom) return false;
    if (filterTo && s.date > filterTo) return false;
    return true;
  });

  const statsMap = new Map<string, PlayerStats>();

  for (const player of data.players) {
    statsMap.set(player.id, {
      playerId: player.id,
      total: 0,
      match: 0,
      bergpreis: 0,
      sieg: 0,
      sessions: 0,
    });
  }

  for (const session of filteredSessions) {
    const allPlayerIds = [...session.teams[0], ...session.teams[1]];

    for (const playerId of allPlayerIds) {
      const stats = statsMap.get(playerId);
      if (stats) stats.sessions += 1;
    }

    for (const entry of session.chritz) {
      const teamPlayers = session.teams[entry.teamIndex];
      for (const playerId of teamPlayers) {
        const stats = statsMap.get(playerId);
        if (stats) {
          stats.total += 1;
          stats[entry.type as ChritzType] += 1;
        }
      }
    }
  }

  return Array.from(statsMap.values()).sort((a, b) => b.total - a.total);
}

// Per-session chritz count for a player (for line chart)
export interface SessionPoint {
  date: string;
  sessionId: string;
  chritz: number;
  cumulative: number;
}

export function getPlayerHistory(data: AppData, playerId: string): SessionPoint[] {
  const playerSessions = data.sessions
    .filter((s) => [...s.teams[0], ...s.teams[1]].includes(playerId))
    .sort((a, b) => a.date.localeCompare(b.date));

  let cumulative = 0;
  return playerSessions.map((s) => {
    const teamIndex = s.teams[0].includes(playerId) ? 0 : 1;
    const chritz = s.chritz.filter((c) => c.teamIndex === teamIndex).length;
    cumulative += chritz;
    return {
      date: s.date,
      sessionId: s.id,
      chritz,
      cumulative,
    };
  });
}

// Export / Import
export function exportData(data: AppData): void {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `jass-stats-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importData(file: File): Promise<AppData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string) as AppData;
        // Basic validation
        if (!Array.isArray(data.players) || !Array.isArray(data.sessions)) {
          reject(new Error('Ungültiges Dateiformat'));
          return;
        }
        resolve(data);
      } catch {
        reject(new Error('Datei konnte nicht gelesen werden'));
      }
    };
    reader.onerror = () => reject(new Error('Fehler beim Lesen der Datei'));
    reader.readAsText(file);
  });
}

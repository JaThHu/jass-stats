import type { AppData, Chritz, Evening, Game, Player, Round, TableName, TeamIndex } from '../lib/types';

export type Row = Record<string, unknown>;
type Entity = AppData[TableName][number];

const iso = (v: unknown) => {
  const d = new Date(String(v));
  return Number.isNaN(d.getTime()) ? String(v) : d.toISOString();
};
const team = (v: unknown): TeamIndex => (Number(v) === 1 ? 1 : 0);
const teamOrNull = (v: unknown): TeamIndex | null => (v === null || v === undefined ? null : team(v));
const numOrNull = (v: unknown): number | null => (v === null || v === undefined ? null : Number(v));

export function toRow(table: TableName, x: Entity): Row {
  switch (table) {
    case 'players': {
      const p = x as Player;
      return { id: p.id, name: p.name, created_at: p.createdAt };
    }
    case 'evenings': {
      const e = x as Evening;
      return {
        id: e.id,
        date: e.date,
        team0: e.teams[0],
        team1: e.teams[1],
        status: e.status,
        notes: e.notes,
        created_at: e.createdAt,
      };
    }
    case 'games': {
      const g = x as Game;
      return { id: g.id, evening_id: g.eveningId, number: g.number, dismissed: g.dismissed, created_at: g.createdAt };
    }
    case 'rounds': {
      const r = x as Round;
      return {
        id: r.id,
        game_id: r.gameId,
        evening_id: r.eveningId,
        seq: r.seq,
        multiplier: r.multiplier,
        stich_team: r.stichTeam,
        stich_points: r.stichPoints,
        match_team: r.matchTeam,
        weis0: r.weis[0],
        weis1: r.weis[1],
        stoeck0: r.stoeck[0],
        stoeck1: r.stoeck[1],
        created_at: r.createdAt,
      };
    }
    case 'chritz': {
      const c = x as Chritz;
      return {
        id: c.id,
        evening_id: c.eveningId,
        game_id: c.gameId,
        round_id: c.roundId,
        type: c.type,
        team: c.team,
        auto: c.auto,
        created_at: c.createdAt,
      };
    }
  }
}

export function fromRow(table: TableName, r: Row): Entity {
  switch (table) {
    case 'players':
      return { id: String(r.id), name: String(r.name), createdAt: iso(r.created_at) } satisfies Player;
    case 'evenings':
      return {
        id: String(r.id),
        date: String(r.date).slice(0, 10),
        teams: [(r.team0 as string[]) ?? [], (r.team1 as string[]) ?? []],
        status: r.status === 'active' ? 'active' : 'done',
        notes: (r.notes as string | null) ?? null,
        createdAt: iso(r.created_at),
      } satisfies Evening;
    case 'games':
      return {
        id: String(r.id),
        eveningId: String(r.evening_id),
        number: Number(r.number),
        dismissed: (r.dismissed as string[]) ?? [],
        createdAt: iso(r.created_at),
      } satisfies Game;
    case 'rounds':
      return {
        id: String(r.id),
        gameId: String(r.game_id),
        eveningId: String(r.evening_id),
        seq: Number(r.seq),
        multiplier: Number(r.multiplier) || 1,
        stichTeam: teamOrNull(r.stich_team),
        stichPoints: numOrNull(r.stich_points),
        matchTeam: teamOrNull(r.match_team),
        weis: [Number(r.weis0) || 0, Number(r.weis1) || 0],
        stoeck: [Boolean(r.stoeck0), Boolean(r.stoeck1)],
        createdAt: iso(r.created_at),
      } satisfies Round;
    case 'chritz':
      return {
        id: String(r.id),
        eveningId: String(r.evening_id),
        gameId: (r.game_id as string | null) ?? null,
        roundId: (r.round_id as string | null) ?? null,
        type: r.type as Chritz['type'],
        team: team(r.team),
        auto: Boolean(r.auto),
        createdAt: iso(r.created_at),
      } satisfies Chritz;
  }
}

import { describe, expect, it } from 'vitest';
import { diff } from './sync';
import { fromRow, toRow } from './mapping';
import { addRound, deleteRound, startEvening, resolveEvent } from '../lib/actions';
import { pendingEvents } from '../lib/scoring';
import { EMPTY_DATA, type AppData } from '../lib/types';

const base: AppData = {
  ...EMPTY_DATA,
  players: ['a', 'b', 'c', 'd'].map((id, i) => ({ id, name: id.toUpperCase(), createdAt: `2025-01-0${i + 1}T00:00:00.000Z` })),
};

describe('diff & mapping', () => {
  it('erzeugt nur Operationen für geänderte Zeilen, Kinder zuerst gelöscht', () => {
    const d1 = startEvening(base, [['a', 'b'], ['c', 'd']], '2026-11-11');
    const ops1 = diff(base, d1);
    expect(ops1.map((o) => `${o.kind}:${o.table}`)).toEqual(['upsert:evenings', 'upsert:games']);

    const gameId = d1.games[0].id;
    const d2 = addRound(d1, gameId, { multiplier: 1, matchTeam: 0, stichTeam: null, stichPoints: null, weis: [0, 0], stoeck: [false, false] });
    const ev = pendingEvents(d2, gameId)[0];
    const d3 = resolveEvent(d2, gameId, ev, 0);
    expect(diff(d2, d3).map((o) => `${o.kind}:${o.table}`)).toEqual(['upsert:chritz']);

    const d4 = deleteRound(d3, d3.rounds[0].id);
    expect(diff(d3, d4).map((o) => `${o.kind}:${o.table}`)).toEqual(['delete:chritz', 'delete:rounds']);
  });

  it('Zeilen überstehen den Weg in die Datenbank und zurück', () => {
    const d1 = startEvening(base, [['a', 'b'], ['c', 'd']], '2026-11-11');
    const d2 = addRound(d1, d1.games[0].id, {
      multiplier: 2,
      matchTeam: null,
      stichTeam: 1,
      stichPoints: 90,
      weis: [50, 0],
      stoeck: [false, true],
    });
    for (const t of ['players', 'evenings', 'games', 'rounds'] as const) {
      for (const row of d2[t]) expect(fromRow(t, toRow(t, row))).toEqual(row);
    }
  });
});

import { describe, expect, it } from 'vitest';
import { detectEvents, pendingEvents, reconcileGame, roundPoints, splitTally, totals } from './scoring';
import type { AppData, Round, TeamIndex } from './types';

let seq = 0;
function round(p: Partial<Round>): Round {
  seq += 1;
  return {
    id: `r${seq}`,
    gameId: 'g1',
    eveningId: 'e1',
    seq,
    multiplier: 1,
    stichTeam: null,
    stichPoints: null,
    matchTeam: null,
    weis: [0, 0],
    stoeck: [false, false],
    createdAt: new Date(2026, 0, 1, 20, 0, seq).toISOString(),
    ...p,
  };
}
const stich = (team: TeamIndex, points: number, multiplier = 1) => round({ stichTeam: team, stichPoints: points, multiplier });

function data(rounds: Round[]): AppData {
  return {
    players: [],
    evenings: [{ id: 'e1', date: '2026-01-01', teams: [['a', 'b'], ['c', 'd']], status: 'active', notes: null, createdAt: '' }],
    games: [{ id: 'g1', eveningId: 'e1', number: 1, dismissed: [], createdAt: '' }],
    rounds,
    chritz: [],
  };
}

describe('roundPoints', () => {
  it('gibt dem Gegner den Rest auf 157', () => {
    expect(roundPoints(stich(0, 100))).toEqual([100, 57]);
    expect(roundPoints(stich(1, 100))).toEqual([57, 100]);
  });
  it('multipliziert Stich, Weis und Stöck', () => {
    const r = round({ stichTeam: 0, stichPoints: 80, multiplier: 2, weis: [50, 0], stoeck: [false, true] });
    expect(roundPoints(r)).toEqual([(80 + 50) * 2, (77 + 20) * 2]);
  });
  it('Match = 257 für ein Team, 0 für das andere', () => {
    expect(roundPoints(round({ matchTeam: 1, multiplier: 3 }))).toEqual([0, 771]);
  });
  it('nur Weis ohne Stich', () => {
    expect(roundPoints(round({ weis: [0, 100], multiplier: 2 }))).toEqual([0, 200]);
  });
});

describe('detectEvents', () => {
  it('erkennt Match, Bergpreis und Sieg je beim ersten Überschreiten', () => {
    const rounds = [
      ...Array.from({ length: 9 }, () => stich(0, 157)), // A: 1413, B: 0
      round({ matchTeam: 0 }), // A: 1670 → Bergpreis + Match
      ...Array.from({ length: 5 }, () => stich(0, 157)), // A: 2455
      stich(0, 100), // A: 2555 → Sieg
      stich(0, 100),
    ];
    const ev = detectEvents(rounds);
    expect(ev.map((e) => [e.type, e.roundId, e.candidates])).toEqual([
      ['match', rounds[9].id, [0]],
      ['bergpreis', rounds[9].id, [0]],
      ['sieg', rounds[15].id, [0]],
    ]);
  });

  it('meldet beide Teams, wenn beide in derselben Runde die Grenze überschreiten', () => {
    const rounds = [round({ weis: [1450, 1450] }), stich(0, 80)];
    const ev = detectEvents(rounds).find((e) => e.type === 'bergpreis');
    expect(ev?.candidates).toEqual([0, 1]);
  });

  it('nur das erste Team bekommt den Bergpreis', () => {
    const rounds = [round({ weis: [1490, 1300] }), stich(0, 20), stich(1, 157)];
    const bp = detectEvents(rounds).filter((e) => e.type === 'bergpreis');
    expect(bp).toHaveLength(1);
    expect(bp[0].candidates).toEqual([0]);
  });
});

describe('pending & reconcile', () => {
  it('bestätigte und abgelehnte Vorschläge sind nicht mehr offen', () => {
    const rounds = [round({ matchTeam: 0 }), round({ matchTeam: 1 })];
    const d = data(rounds);
    expect(pendingEvents(d, 'g1')).toHaveLength(2);
    d.chritz.push({ id: 'c1', eveningId: 'e1', gameId: 'g1', roundId: rounds[0].id, type: 'match', team: 0, auto: true, createdAt: '' });
    d.games[0].dismissed = [`match:${rounds[1].id}`];
    expect(pendingEvents(d, 'g1')).toHaveLength(0);
  });

  it('entfernt automatische Chritz, wenn die Runde gelöscht wird', () => {
    const rounds = [round({ matchTeam: 0 }), stich(0, 50)];
    const d = data(rounds);
    d.chritz.push(
      { id: 'c1', eveningId: 'e1', gameId: 'g1', roundId: rounds[0].id, type: 'match', team: 0, auto: true, createdAt: '' },
      { id: 'c2', eveningId: 'e1', gameId: null, roundId: null, type: 'sieg', team: 1, auto: false, createdAt: '' },
    );
    const next = reconcileGame({ ...d, rounds: [rounds[1]] }, 'g1');
    expect(next.chritz.map((c) => c.id)).toEqual(['c2']);
  });

  it('lässt unveränderte Daten unangetastet', () => {
    const d = data([stich(0, 50)]);
    expect(reconcileGame(d, 'g1')).toBe(d);
  });
});

describe('splitTally', () => {
  it('zerlegt in 100er, 50er, 20er und Rest', () => {
    expect(splitTally(387)).toEqual({ s100: 3, s50: 1, s20: 1, rest: 17 });
    expect(totals([stich(0, 157), stich(1, 157)])).toEqual([157, 157]);
  });
});

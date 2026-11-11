import { describe, expect, it } from 'vitest';
import { convertLegacy, parseImport } from './legacy';
import { rotationInfo } from './rotation';
import { duoStats, headToHead, playerStats, scopeToSeason, streaks } from './stats';

const legacy = {
  players: [
    { id: 'a', name: 'Anna', createdAt: '2025-01-01T00:00:00Z' },
    { id: 'b', name: 'Beat', createdAt: '2025-01-02T00:00:00Z' },
    { id: 'c', name: 'Chris', createdAt: '2025-01-03T00:00:00Z' },
    { id: 'd', name: 'Dani', createdAt: '2025-01-04T00:00:00Z' },
  ],
  sessions: [
    {
      id: 's2',
      date: '2026-02-01',
      teams: [['a', 'c'], ['b', 'd']] as [string[], string[]],
      chritz: [
        { id: 'x1', type: 'sieg' as const, teamIndex: 1 as const },
        { id: 'x2', type: 'match' as const, teamIndex: 1 as const },
      ],
    },
    {
      id: 's1',
      date: '2025-12-01',
      teams: [['a', 'b'], ['c', 'd']] as [string[], string[]],
      chritz: [
        { id: 'y1', type: 'bergpreis' as const, teamIndex: 0 as const },
        { id: 'y2', type: 'sieg' as const, teamIndex: 0 as const },
        { id: 'y3', type: 'sieg' as const, teamIndex: 0 as const },
      ],
    },
  ],
};

describe('legacy import', () => {
  it('übernimmt Spieler, Abende und Chritz', () => {
    const d = convertLegacy(legacy);
    expect(d.players).toHaveLength(4);
    expect(d.evenings).toHaveLength(2);
    expect(d.chritz).toHaveLength(5);
    expect(d.evenings.every((e) => e.status === 'done')).toBe(true);
    expect(parseImport(legacy)).toEqual(d);
  });
});

describe('Statistiken', () => {
  const d = convertLegacy(legacy);

  it('zählt Chritz (Sieg = 2) und Siegquote', () => {
    const a = playerStats(d).find((s) => s.playerId === 'a')!;
    expect(a.chritz).toBe(5); // Bergpreis 1 + 2 Siege à 2
    expect(a.games).toBe(3);
    expect(a.sieg).toBe(2);
    expect(a.winRate).toBeCloseTo(2 / 3);
    expect(a.eveningWins).toBe(1);
    const b = playerStats(d).find((s) => s.playerId === 'b')!;
    expect(b.chritz).toBe(8);
  });

  it('filtert nach Saison', () => {
    const s = playerStats(scopeToSeason(d, 2026)).find((x) => x.playerId === 'a')!;
    expect(s.evenings).toBe(1);
    expect(s.chritz).toBe(0);
  });

  it('Duos und Direktvergleich', () => {
    const ab = duoStats(d).find((x) => x.key === 'a|b')!;
    expect(ab.wins).toBe(2);
    expect(ab.games).toBe(2);
    const h = headToHead(d);
    expect(h).toHaveLength(2);
    const abcd = h.find((x) => x.key === 'a|b#c|d')!;
    expect(abcd.wins).toEqual([2, 0]);
  });

  it('Serien in chronologischer Reihenfolge', () => {
    const a = streaks(d).find((x) => x.playerId === 'a')!;
    expect(a.form).toEqual(['W', 'W', 'L']);
    expect(a.longest).toBe(2);
    expect(a.current).toBe(0);
  });

  it('Rotation schlägt die nächste Paarung vor', () => {
    const r = rotationInfo(d)!;
    // Letzter Abend (2026) war A&C vs B&D = Paarung B → nächste ist C
    expect(r.lastIndex).toBe(1);
    expect(r.nextIndex).toBe(2);
  });
});

describe('Mein Team unten', () => {
  it('erkennt Janick als Standard und findet sein Team', async () => {
    const { myTeam, resolveMe } = await import('./me');
    const players = [
      { id: 'x', name: 'Tom', createdAt: '' },
      { id: 'j', name: 'Janick', createdAt: '' },
    ];
    expect(resolveMe({ players })).toBe('j');
    const ev = { id: 'e', date: '2026-01-01', teams: [['x', 'y'], ['j', 'z']] as [string[], string[]], status: 'active' as const, notes: null, createdAt: '' };
    expect(myTeam(ev, 'j')).toBe(1);
    expect(myTeam(ev, null)).toBe(0);
  });
});

describe('Weis zählt nicht als Runde', () => {
  it('Runden, Ø Punkte und Verlauf ohne Weis-Einträge', async () => {
    const { startEvening, addRound } = await import('./actions');
    const { gameSummary, eveningSummary } = await import('./stats');
    const base = convertLegacy({ players: legacy.players, sessions: [] });
    let d = startEvening(base, [['a', 'b'], ['c', 'd']], '2026-11-11');
    const g = d.games[0];
    const r = (p: Partial<Parameters<typeof addRound>[2]>) => ({
      multiplier: 1, stichTeam: null, stichPoints: null, matchTeam: null, weis: [0, 0] as [number, number], stoeck: [false, false] as [boolean, boolean], ...p,
    });
    d = addRound(d, g.id, r({ stichTeam: 0, stichPoints: 100 }));
    d = addRound(d, g.id, r({ weis: [150, 0] }));
    d = addRound(d, g.id, r({ stichTeam: 1, stichPoints: 57, multiplier: 2 }));

    const sum = gameSummary(d, g);
    expect(sum.played).toBe(2);
    expect(sum.series.map((p) => [p.n, p.weis])).toEqual([[0, false], [1, false], [1, true], [2, false]]);
    expect(eveningSummary(d, d.evenings[0].id)!.rounds).toBe(2);

    const a = playerStats(d).find((s) => s.playerId === 'a')!;
    expect(a.rounds).toBe(2);
    expect(a.weis).toBe(150);
    expect(a.avgPoints).toBe((100 + 200) / 2); // Stichpunkte: 100 und (157−57)×2
  });
});

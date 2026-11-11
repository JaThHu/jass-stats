import { Fragment, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Minus, Plus } from 'lucide-react';
import { useApp } from '../data/store';
import { addPastEvening } from '../lib/actions';
import { teamName } from '../lib/format';
import { todayIso } from '../lib/ids';
import { PAIRING_LABELS, rotationInfo } from '../lib/rotation';
import { CHRITZ_ICONS, CHRITZ_LABELS, CHRITZ_TYPES, CHRITZ_VALUE, type ChritzType, type TeamIndex } from '../lib/types';
import { Button, Card, Label, PageHeader, TeamDot } from '../components/ui';
import { cx } from '../lib/cx';

type Counts = [Record<ChritzType, number>, Record<ChritzType, number>];

export default function EveningNew() {
  const { data, commit } = useApp();
  const navigate = useNavigate();
  const rot = rotationInfo(data);
  const [date, setDate] = useState(todayIso());
  const [pairing, setPairing] = useState<number | null>(null);
  const [custom, setCustom] = useState<[string[], string[]]>([[], []]);
  const [counts, setCounts] = useState<Counts>([
    { match: 0, bergpreis: 0, sieg: 0 },
    { match: 0, bergpreis: 0, sieg: 0 },
  ]);

  const useRotation = !!rot && data.players.length === 4;
  const teams: [string[], string[]] = useRotation ? rot.pairings[pairing ?? rot.nextIndex] : custom;
  const teamsOk = teams[0].length === 2 && teams[1].length === 2;

  const togglePlayer = (id: string, t: TeamIndex) => {
    setCustom((prev) => {
      const next: [string[], string[]] = [prev[0].filter((x) => x !== id), prev[1].filter((x) => x !== id)];
      if (!prev[t].includes(id) && next[t].length < 2) next[t] = [...next[t], id];
      return next;
    });
  };

  const bump = (t: TeamIndex, type: ChritzType, delta: number) =>
    setCounts((prev) => {
      const next: Counts = [{ ...prev[0] }, { ...prev[1] }];
      next[t][type] = Math.max(0, next[t][type] + delta);
      return next;
    });

  const save = () => {
    const chritz: { type: ChritzType; team: TeamIndex }[] = [];
    for (const t of [0, 1] as TeamIndex[]) {
      for (const type of CHRITZ_TYPES) for (let i = 0; i < counts[t][type]; i++) chritz.push({ type, team: t });
    }
    commit((d) => addPastEvening(d, { date, teams, chritz }));
    navigate('/abende');
  };

  return (
    <div className="space-y-4">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm font-semibold text-ink-3 active:text-ink pt-1">
        <ChevronLeft size={18} /> Zurück
      </button>
      <PageHeader title="Abend nachtragen" subtitle="Für Abende, die nicht auf der Tafel gespielt wurden." />

      <Card className="p-4">
        <Label className="mb-2">Datum</Label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full bg-surface-2 border border-line rounded-xl px-4 py-3 text-base text-ink outline-none focus:border-brand/60"
        />
      </Card>

      <Card className="p-4 space-y-3">
        <Label>Teams</Label>
        {useRotation ? (
          <div className="space-y-2">
            {rot.pairings.map((p, i) => (
              <button
                key={i}
                onClick={() => setPairing(i)}
                className={cx(
                  'w-full flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-sm transition-colors',
                  (pairing ?? rot.nextIndex) === i ? 'border-brand/60 bg-brand/10 text-ink' : 'border-line bg-surface-2 text-ink-2',
                )}
              >
                <span className="w-6 h-6 rounded-full bg-surface-3 text-xs font-bold flex items-center justify-center">
                  {PAIRING_LABELS[i]}
                </span>
                <span className="flex-1 truncate">
                  {teamName(data, p[0])} <span className="text-ink-3">vs</span> {teamName(data, p[1])}
                </span>
              </button>
            ))}
          </div>
        ) : data.players.length < 4 ? (
          <p className="text-sm text-gold">Mindestens 4 Spieler nötig – erfasse sie unter «Spieler».</p>
        ) : (
          ([0, 1] as TeamIndex[]).map((t) => (
            <div key={t}>
              <p className="text-xs text-ink-3 mb-1.5 flex items-center gap-1.5">
                <TeamDot team={t} className="w-2 h-2" /> Team {t + 1} ({custom[t].length}/2)
              </p>
              <div className="flex flex-wrap gap-2">
                {data.players.map((p) => {
                  const inThis = custom[t].includes(p.id);
                  const inOther = custom[t === 0 ? 1 : 0].includes(p.id);
                  return (
                    <button
                      key={p.id}
                      onClick={() => togglePlayer(p.id, t)}
                      disabled={inOther || (!inThis && custom[t].length >= 2)}
                      className={cx(
                        'px-3.5 py-2 rounded-xl text-sm font-semibold border transition-colors',
                        inThis ? 'bg-ink text-bg border-ink' : 'bg-surface-2 text-ink-2 border-line disabled:opacity-35',
                      )}
                    >
                      {p.name}
                    </button>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </Card>

      <Card className="p-4">
        <Label className="mb-3">Chritz</Label>
        <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] gap-x-2 gap-y-2 items-center">
          <span />
          {([0, 1] as TeamIndex[]).map((t) => {
            const total = CHRITZ_TYPES.reduce((s, type) => s + counts[t][type] * CHRITZ_VALUE[type], 0);
            return (
              <div key={t} className="w-[104px] flex items-center gap-1.5 min-w-0 text-xs text-ink-2">
                <TeamDot team={t} className="w-2 h-2" />
                <span className="truncate flex-1">{teamsOk ? teamName(data, teams[t]) : `Team ${t + 1}`}</span>
                <span className="font-bold text-gold">{total}</span>
              </div>
            );
          })}
          {CHRITZ_TYPES.map((type) => (
            <Fragment key={type}>
              <span className="text-sm text-ink truncate">
                {CHRITZ_ICONS[type]} {CHRITZ_LABELS[type]}
              </span>
              {([0, 1] as TeamIndex[]).map((t) => (
                <div key={t} className="w-[104px] flex items-center justify-between rounded-xl bg-surface-2 border border-line px-1 py-1">
                  <button onClick={() => bump(t, type, -1)} aria-label="weniger" className="p-1.5 text-ink-3 active:text-ink">
                    <Minus size={15} />
                  </button>
                  <span className="font-bold text-ink tabular">{counts[t][type]}</span>
                  <button onClick={() => bump(t, type, 1)} aria-label="mehr" className="p-1.5 text-ink-2 active:text-ink">
                    <Plus size={15} />
                  </button>
                </div>
              ))}
            </Fragment>
          ))}
        </div>
      </Card>

      <Button variant="primary" size="lg" className="w-full" disabled={!teamsOk || !date} onClick={save}>
        Abend speichern
      </Button>
    </div>
  );
}

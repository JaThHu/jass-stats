import { useEffect, useState } from 'react';
import { Delete, Trash2, Zap, ChevronDown, X } from 'lucide-react';
import { roundPoints } from '../../lib/scoring';
import { MULTIPLIERS, STICH_TOTAL, type Round, type TeamIndex } from '../../lib/types';
import type { RoundInput } from '../../lib/actions';
import { Button, Segmented, Sheet, TeamDot } from '../ui';
import { cx } from '../../lib/cx';

const WEIS_STEPS = [20, 50, 100, 150, 200];

interface Draft {
  team: TeamIndex;
  points: string;
  match: boolean;
  multiplier: number;
  weis: [number, number];
  stoeck: [boolean, boolean];
  showWeis: boolean;
}

function draftFrom(round: Round | null, team: TeamIndex, multiplier: number): Draft {
  if (!round) {
    return { team, points: '', match: false, multiplier, weis: [0, 0], stoeck: [false, false], showWeis: false };
  }
  return {
    team: round.matchTeam ?? round.stichTeam ?? team,
    points: round.stichPoints !== null && round.matchTeam === null ? String(round.stichPoints) : '',
    match: round.matchTeam !== null,
    multiplier: round.multiplier,
    weis: [...round.weis],
    stoeck: [...round.stoeck],
    showWeis: round.weis[0] + round.weis[1] > 0 || round.stoeck[0] || round.stoeck[1],
  };
}

function toInput(d: Draft): RoundInput {
  const hasStich = !d.match && d.points !== '';
  return {
    multiplier: d.multiplier,
    matchTeam: d.match ? d.team : null,
    stichTeam: hasStich ? d.team : null,
    stichPoints: hasStich ? parseInt(d.points, 10) : null,
    weis: d.weis,
    stoeck: d.stoeck,
  };
}

export function RoundSheet({
  names,
  initialTeam,
  round,
  roundNumber,
  lastMultiplier,
  onSave,
  onDelete,
  onClose,
}: {
  names: [string, string];
  initialTeam: TeamIndex;
  round: Round | null;
  roundNumber: number;
  lastMultiplier: number;
  onSave: (input: RoundInput) => void;
  onDelete?: () => void;
  onClose: () => void;
}) {
  const [d, setD] = useState<Draft>(() => draftFrom(round, initialTeam, lastMultiplier));
  const set = (patch: Partial<Draft>) => setD((prev) => ({ ...prev, ...patch }));

  const pts = d.points === '' ? null : parseInt(d.points, 10);
  const tooMany = pts !== null && pts > STICH_TOTAL;
  const weisSum = d.weis[0] + d.weis[1] + (d.stoeck[0] ? 20 : 0) + (d.stoeck[1] ? 20 : 0);
  const valid = !tooMany && (d.match || pts !== null || weisSum > 0);
  const input = toInput(d);
  const preview = roundPoints(input);
  const other: TeamIndex = d.team === 0 ? 1 : 0;

  const digit = (n: number) =>
    setD((prev) => {
      if (prev.match) return prev;
      const next = prev.points === '0' ? String(n) : prev.points + n;
      return next.length > 3 ? prev : { ...prev, points: next };
    });
  const back = () => setD((prev) => ({ ...prev, points: prev.points.slice(0, -1) }));

  const save = () => {
    if (!valid) return;
    navigator.vibrate?.(12);
    onSave(input);
  };

  // Tastatur-Eingabe (Desktop)
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (/^[0-9]$/.test(e.key)) digit(Number(e.key));
      else if (e.key === 'Backspace') back();
      else if (e.key === 'Enter') save();
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  });

  const addWeis = (t: TeamIndex, v: number) =>
    setD((prev) => {
      const weis: [number, number] = [...prev.weis];
      weis[t] += v;
      return { ...prev, weis };
    });
  const clearWeis = (t: TeamIndex) =>
    setD((prev) => {
      const weis: [number, number] = [...prev.weis];
      const stoeck: [boolean, boolean] = [...prev.stoeck];
      weis[t] = 0;
      stoeck[t] = false;
      return { ...prev, weis, stoeck };
    });
  const toggleStoeck = (t: TeamIndex) =>
    setD((prev) => {
      const on = !prev.stoeck[t];
      const stoeck: [boolean, boolean] = [false, false];
      stoeck[t] = on;
      return { ...prev, stoeck };
    });

  const key =
    'h-[50px] rounded-xl bg-surface-2 border border-line text-ink text-[22px] font-semibold active:bg-surface-3 transition-colors disabled:text-ink-3/40';

  return (
    <Sheet
      title={round ? `Runde ${roundNumber} bearbeiten` : `Runde ${roundNumber}`}
      onClose={onClose}
      right={
        onDelete && (
          <button onClick={onDelete} aria-label="Runde löschen" className="p-2 text-danger rounded-full active:bg-danger/10">
            <Trash2 size={20} />
          </button>
        )
      }
    >
      <div className="space-y-3.5">
        <div>
          <p className="text-xs font-medium text-ink-3 mb-1.5">Punkte von</p>
          <Segmented<TeamIndex>
            value={d.team}
            onChange={(team) => set({ team })}
            options={[0, 1].map((t) => ({
              value: t as TeamIndex,
              label: (
                <span className="inline-flex items-center gap-2 justify-center max-w-full">
                  <TeamDot team={t as TeamIndex} />
                  <span className="truncate">{names[t]}</span>
                </span>
              ),
            }))}
          />
        </div>

        <div className="flex gap-2.5">
          <div
            className={cx(
              'flex-1 min-w-0 rounded-2xl border px-4 py-2.5 flex items-center justify-between gap-3',
              tooMany ? 'border-danger/60 bg-danger/10' : 'border-line bg-bg',
            )}
          >
            <span className={cx('text-[40px] font-bold leading-none tabular', d.points === '' && !d.match ? 'text-ink-3/40' : 'text-ink')}>
              {d.match ? 257 : d.points || '0'}
            </span>
            <span className="text-right text-xs text-ink-3 leading-tight">
              {tooMany ? (
                <span className="text-danger font-semibold">max. 157</span>
              ) : d.match ? (
                <>Match</>
              ) : pts !== null ? (
                <>
                  Gegner
                  <br />
                  <span className="text-base font-semibold text-ink-2 tabular">{STICH_TOTAL - pts}</span>
                </>
              ) : (
                <>Stichpunkte</>
              )}
            </span>
          </div>
          <button
            onClick={() => set({ match: !d.match })}
            className={cx(
              'w-[76px] rounded-2xl border flex flex-col items-center justify-center gap-0.5 font-bold text-sm transition-colors',
              d.match ? 'bg-gold text-[#1c1405] border-gold' : 'bg-surface-2 text-ink-2 border-line active:bg-surface-3',
            )}
          >
            <Zap size={20} fill={d.match ? 'currentColor' : 'none'} />
            Match
          </button>
        </div>

        <Segmented<number>
          value={d.multiplier}
          onChange={(multiplier) => set({ multiplier })}
          options={MULTIPLIERS.map((m) => ({
            value: m,
            label: `${m}×`,
            activeClass: m === 1 ? undefined : 'bg-gold/90 text-[#1c1405]',
          }))}
        />

        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
            <button key={n} className={key} disabled={d.match} onClick={() => digit(n)}>
              {n}
            </button>
          ))}
          <button className={cx(key, 'text-base text-ink-2')} disabled={d.match || d.points === ''} onClick={() => set({ points: '' })}>
            C
          </button>
          <button className={key} disabled={d.match} onClick={() => digit(0)}>
            0
          </button>
          <button className={cx(key, 'flex items-center justify-center')} disabled={d.match} onClick={back} aria-label="Löschen">
            <Delete size={22} />
          </button>
        </div>

        <div className="rounded-2xl border border-line bg-bg">
          <button
            onClick={() => set({ showWeis: !d.showWeis })}
            className="w-full flex items-center justify-between px-4 py-3 text-[15px] font-semibold text-ink"
          >
            <span>
              Weis / Stöck
              {weisSum > 0 && <span className="ml-2 text-gold tabular">+{weisSum}</span>}
            </span>
            <ChevronDown size={18} className={cx('text-ink-3 transition-transform', d.showWeis && 'rotate-180')} />
          </button>
          {d.showWeis && (
            <div className="grid grid-cols-2 gap-3 px-3 pb-3">
              {([0, 1] as TeamIndex[]).map((t) => {
                const sum = d.weis[t] + (d.stoeck[t] ? 20 : 0);
                return (
                  <div key={t} className="min-w-0">
                    <div className="flex items-center gap-1.5 mb-2 min-h-[24px]">
                      <TeamDot team={t} />
                      <span className="text-xs text-ink-2 truncate flex-1">{names[t]}</span>
                      {sum > 0 && (
                        <button
                          onClick={() => clearWeis(t)}
                          className="inline-flex items-center gap-0.5 text-xs font-bold text-gold tabular"
                          aria-label="Weis zurücksetzen"
                        >
                          {sum}
                          <X size={13} />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                      {WEIS_STEPS.map((v) => (
                        <button
                          key={v}
                          onClick={() => addWeis(t, v)}
                          className="h-10 rounded-lg bg-surface-2 border border-line text-sm font-semibold text-ink active:bg-surface-3 tabular"
                        >
                          {v}
                        </button>
                      ))}
                      <button
                        onClick={() => toggleStoeck(t)}
                        className={cx(
                          'h-10 rounded-lg border text-xs font-bold transition-colors',
                          d.stoeck[t] ? 'bg-gold text-[#1c1405] border-gold' : 'bg-surface-2 border-line text-ink-2 active:bg-surface-3',
                        )}
                      >
                        Stöck
                      </button>
                    </div>
                  </div>
                );
              })}
              <p className="col-span-2 text-[11px] text-ink-3">Weis und Stöck zählen mit dem Multiplikator.</p>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 -mx-5 px-5 pt-3 pb-1 bg-surface border-t border-line flex items-center gap-3">
          <div className="flex-1 min-w-0 text-sm space-y-1">
            {([d.team, other] as TeamIndex[]).map((t) => (
              <div key={t} className="flex items-center gap-2">
                <TeamDot team={t} />
                <span className="text-ink-2 truncate flex-1">{names[t]}</span>
                <span className={cx('font-bold tabular', preview[t] ? 'text-ink' : 'text-ink-3')}>+{preview[t]}</span>
              </div>
            ))}
          </div>
          <Button variant="primary" size="lg" className="w-[44%]" disabled={!valid} onClick={save}>
            {round ? 'Speichern' : pts === null && !d.match && weisSum > 0 ? 'Weis eintragen' : 'Eintragen'}
          </Button>
        </div>
      </div>
    </Sheet>
  );
}

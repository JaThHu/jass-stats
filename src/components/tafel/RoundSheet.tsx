import { useEffect, useState } from 'react';
import { Delete, Trash2, Zap } from 'lucide-react';
import { isWeisOnly, roundPoints, weisPair } from '../../lib/scoring';
import { MULTIPLIERS, STICH_TOTAL, type Round, type TeamIndex } from '../../lib/types';
import type { RoundInput } from '../../lib/actions';
import { Button, Segmented, Sheet, TeamDot } from '../ui';
import { cx } from '../../lib/cx';

type Mode = 'punkte' | 'weis';

interface Draft {
  mode: Mode;
  team: TeamIndex;
  value: string;
  match: boolean;
  multiplier: number;
}

function draftFrom(round: Round | null, team: TeamIndex, multiplier: number): Draft {
  if (!round) return { mode: 'punkte', team, value: '', match: false, multiplier };
  if (isWeisOnly(round)) {
    const w = weisPair(round);
    const t: TeamIndex = w[1] > w[0] ? 1 : 0;
    return { mode: 'weis', team: t, value: String(w[t]), match: false, multiplier: round.multiplier };
  }
  return {
    mode: 'punkte',
    team: round.matchTeam ?? round.stichTeam ?? team,
    value: round.matchTeam === null && round.stichPoints !== null ? String(round.stichPoints) : '',
    match: round.matchTeam !== null,
    multiplier: round.multiplier,
  };
}

function toInput(d: Draft, base: Round | null): RoundInput {
  const n = d.value === '' ? null : parseInt(d.value, 10);
  if (d.mode === 'weis') {
    const weis: [number, number] = [0, 0];
    weis[d.team] = n ?? 0;
    return {
      multiplier: d.multiplier,
      matchTeam: null,
      stichTeam: null,
      stichPoints: null,
      weis,
      stoeck: [false, false],
    };
  }
  // Weis, der früher zusammen mit einer Runde erfasst wurde, bleibt beim Bearbeiten erhalten.
  const keep = base && !isWeisOnly(base);
  return {
    multiplier: d.multiplier,
    matchTeam: d.match ? d.team : null,
    stichTeam: !d.match && n !== null ? d.team : null,
    stichPoints: !d.match && n !== null ? n : null,
    weis: keep ? base.weis : [0, 0],
    stoeck: keep ? base.stoeck : [false, false],
  };
}

export function RoundSheet({
  names,
  order,
  initialTeam,
  round,
  roundNumber,
  lastMultiplier,
  onSave,
  onDelete,
  onClose,
}: {
  names: [string, string];
  /** Reihenfolge der Teams in der Auswahl (mein Team zuerst). */
  order: [TeamIndex, TeamIndex];
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

  const isWeis = d.mode === 'weis';
  const n = d.value === '' ? null : parseInt(d.value, 10);
  const tooMany = !isWeis && n !== null && n > STICH_TOTAL;
  const valid = isWeis ? n !== null && n > 0 : !tooMany && (d.match || n !== null);
  const input = toInput(d, round);
  const preview = roundPoints(input);
  const typing = !d.match;

  const digit = (k: number) =>
    setD((prev) => {
      if (prev.mode === 'punkte' && prev.match) return prev;
      const next = prev.value === '0' ? String(k) : prev.value + k;
      return next.length > 3 ? prev : { ...prev, value: next };
    });
  const back = () => setD((prev) => ({ ...prev, value: prev.value.slice(0, -1) }));

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

  const key =
    'h-[52px] rounded-xl bg-surface-2 border border-line text-ink text-[22px] font-semibold active:bg-surface-3 transition-colors disabled:text-ink-3/40';

  let hint: React.ReactNode;
  if (isWeis) hint = <>Weis</>;
  else if (tooMany) hint = <span className="text-danger font-semibold">max. 157</span>;
  else if (d.match) hint = <>Match</>;
  else if (n !== null)
    hint = (
      <>
        Gegner
        <br />
        <span className="text-base font-semibold text-ink-2 tabular">{STICH_TOTAL - n}</span>
      </>
    );
  else hint = <>Stichpunkte</>;

  return (
    <Sheet
      title={round ? `Runde ${roundNumber} bearbeiten` : isWeis ? 'Weis schreiben' : `Runde ${roundNumber}`}
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
        <Segmented<Mode>
          value={d.mode}
          onChange={(mode) => set({ mode, value: '', match: false })}
          options={[
            { value: 'punkte', label: 'Punkte', activeClass: 'bg-brand text-[#06140d]' },
            { value: 'weis', label: 'Weis', activeClass: 'bg-weis text-white' },
          ]}
        />

        <div>
          <p className="text-xs font-medium text-ink-3 mb-1.5">{isWeis ? 'Weis für' : 'Punkte von'}</p>
          <Segmented<TeamIndex>
            value={d.team}
            onChange={(team) => set({ team })}
            options={order.map((t) => ({
              value: t,
              label: (
                <span className="inline-flex items-center gap-2 justify-center max-w-full">
                  <TeamDot team={t} />
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
              tooMany ? 'border-danger/60 bg-danger/10' : isWeis ? 'border-weis/50 bg-weis/10' : 'border-line bg-bg',
            )}
          >
            <span className={cx('text-[40px] font-bold leading-none tabular', d.value === '' && typing ? 'text-ink-3/40' : 'text-ink')}>
              {d.match && !isWeis ? 257 : d.value || '0'}
            </span>
            <span className="text-right text-xs text-ink-3 leading-tight">{hint}</span>
          </div>
          {!isWeis && (
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
          )}
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
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((k) => (
            <button key={k} className={key} disabled={!typing} onClick={() => digit(k)}>
              {k}
            </button>
          ))}
          <button className={cx(key, 'text-base text-ink-2')} disabled={!typing || d.value === ''} onClick={() => set({ value: '' })}>
            C
          </button>
          <button className={key} disabled={!typing} onClick={() => digit(0)}>
            0
          </button>
          <button className={cx(key, 'flex items-center justify-center')} disabled={!typing} onClick={back} aria-label="Löschen">
            <Delete size={22} />
          </button>
        </div>

        <div className="sticky bottom-0 -mx-5 px-5 pt-3 pb-1 bg-surface border-t border-line flex items-center gap-3">
          <div className="flex-1 min-w-0 text-sm space-y-1">
            {order.map((t) => (
              <div key={t} className="flex items-center gap-2">
                <TeamDot team={t} />
                <span className="text-ink-2 truncate flex-1">{names[t]}</span>
                <span className={cx('font-bold tabular', preview[t] ? 'text-ink' : 'text-ink-3')}>+{preview[t]}</span>
              </div>
            ))}
          </div>
          <Button variant={isWeis ? 'weis' : 'primary'} size="lg" className="w-[44%]" disabled={!valid} onClick={save}>
            {round ? 'Speichern' : 'Eintragen'}
          </Button>
        </div>
      </div>
    </Sheet>
  );
}

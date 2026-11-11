import type { CSSProperties, ReactElement } from 'react';
import { Plus } from 'lucide-react';
import { splitTally } from '../../lib/scoring';
import { BERGPREIS_POINTS, SIEG_POINTS, type TeamIndex } from '../../lib/types';
import { TEAM_COLORS } from '../../lib/colors';

const CHALK = 'rgba(237, 242, 240, 0.82)';

function Mark({ style }: { style?: CSSProperties }) {
  return (
    <span
      style={{
        width: 2.5,
        height: 20,
        background: CHALK,
        borderRadius: 2,
        display: 'inline-block',
        flexShrink: 0,
        ...style,
      }}
    />
  );
}

function Bundle({ n }: { n: 2 | 4 }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', position: 'relative', gap: 3.5, marginRight: n === 4 ? 11 : 9 }}>
      {Array.from({ length: n }, (_, i) => (
        <Mark key={i} />
      ))}
      <span
        style={{
          position: 'absolute',
          width: `calc(100% + ${n === 4 ? 8 : 6}px)`,
          height: 2,
          background: CHALK,
          top: '50%',
          left: n === 4 ? -4 : -3,
          transform: `rotate(${n === 4 ? -38 : -52}deg)`,
          borderRadius: 2,
        }}
      />
    </span>
  );
}

function tally(count: number, kind: '100' | '50' | '20'): ReactElement[] {
  const out: ReactElement[] = [];
  if (kind === '50') {
    for (let i = 0; i < Math.floor(count / 2); i++) out.push(<Bundle key={`p${i}`} n={2} />);
    if (count % 2) out.push(<Mark key="s" style={{ marginRight: 5 }} />);
  } else {
    for (let i = 0; i < Math.floor(count / 5); i++) out.push(<Bundle key={`g${i}`} n={4} />);
    for (let i = 0; i < count % 5; i++) out.push(<Mark key={`r${i}`} style={{ marginRight: 3.5 }} />);
  }
  return out;
}

function Row({ label, count, kind, rest }: { label: string; count: number; kind: '100' | '50' | '20'; rest?: number }) {
  return (
    <div className="relative flex items-center flex-wrap gap-y-2 min-h-[40px] pl-9 pr-12 py-1.5">
      <span className="absolute left-0 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-ink-3/70 tabular">{label}</span>
      {tally(count, kind)}
      {rest !== undefined && rest > 0 && (
        <span className="absolute right-1 top-1/2 -translate-y-1/2 text-lg font-semibold tabular" style={{ color: CHALK }}>
          {rest}
        </span>
      )}
    </div>
  );
}

export interface BoardSideProps {
  team: TeamIndex;
  name: string;
  total: number;
  rotated?: boolean;
  bergpreisDone: boolean;
  disabled?: boolean;
  isWinner?: boolean;
  /** Geschriebener Weis dieser Partie (inkl. Multiplikator). */
  weis: number;
  onAdd: () => void;
}

export function BoardSide({ team, name, total, rotated, bergpreisDone, disabled, isWinner, weis, onAdd }: BoardSideProps) {
  const split = splitTally(total);
  const color = TEAM_COLORS[team];
  const target = !bergpreisDone && total < BERGPREIS_POINTS ? BERGPREIS_POINTS : SIEG_POINTS;
  const remaining = Math.max(0, target - total);

  return (
    <div className="px-4 pt-4 pb-3.5" style={{ transform: rotated ? 'rotate(180deg)' : undefined }}>
      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
            <p className="font-bold text-ink truncate text-[17px]">{name}</p>
            {isWinner && <span className="text-sm">🏆</span>}
          </div>
          <p className="text-xs text-ink-3 mt-0.5 tabular">
            {total >= SIEG_POINTS
              ? 'Ziel erreicht'
              : `${target === BERGPREIS_POINTS ? '🏔️ Bergpreis' : '🏆 Sieg'} in ${remaining}`}
          </p>
        </div>
        <button
          onClick={onAdd}
          disabled={disabled}
          aria-label={`Punkte für ${name} eintragen`}
          className="w-14 h-14 rounded-2xl bg-brand text-[#06140d] flex items-center justify-center active:bg-brand-strong disabled:bg-surface-3 disabled:text-ink-3 transition-colors shadow-[0_6px_20px_rgba(60,207,135,0.25)] disabled:shadow-none"
        >
          <Plus size={28} strokeWidth={2.6} />
        </button>
      </div>

      <div className="relative mt-3">
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden
        >
          <g stroke="rgba(237,242,240,0.09)" strokeWidth="3" strokeLinecap="round" vectorEffect="non-scaling-stroke">
            <line x1="3" y1="12" x2="97" y2="12" />
            <line x1="97" y1="12" x2="3" y2="88" />
            <line x1="3" y1="88" x2="97" y2="88" />
          </g>
        </svg>
        <Row label="100" count={split.s100} kind="100" />
        <Row label="50" count={split.s50} kind="50" />
        <Row label="20" count={split.s20} kind="20" rest={split.rest} />
      </div>

      <div className="flex items-end gap-4 mt-2">
        <div className="flex-1 pb-1.5">
          <div className="relative h-1.5 rounded-full bg-white/[0.07]">
            <div
              className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-500"
              style={{ width: `${Math.min(100, (total / SIEG_POINTS) * 100)}%`, background: color }}
            />
            <span
              className="absolute -top-1 w-px h-3.5 bg-ink-3/70"
              style={{ left: `${(BERGPREIS_POINTS / SIEG_POINTS) * 100}%` }}
            />
          </div>
          <div className="relative h-3 mt-1 text-[10px] text-ink-3 tabular">
            <span className="absolute -translate-x-1/2" style={{ left: `${(BERGPREIS_POINTS / SIEG_POINTS) * 100}%` }}>
              1500
            </span>
            <span className="absolute right-0">2500</span>
          </div>
        </div>
        <div className="text-right min-w-[96px]">
          {weis > 0 && <p className="text-[11px] font-semibold text-weis tabular mb-0.5">davon Weis {weis}</p>}
          <p className="text-[40px] font-bold leading-none text-ink tracking-tight">{total}</p>
        </div>
      </div>
    </div>
  );
}

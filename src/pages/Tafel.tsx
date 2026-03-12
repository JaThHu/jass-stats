import { useState, useEffect } from 'react';
import type { CSSProperties, ReactElement } from 'react';

// ===== Types =====
interface SideState {
  s100: number;
  s50: number;
  s20: number;
  rest: number | null;
  weisTotal: number;
}

interface GameState {
  A: SideState;
  B: SideState;
}

interface EntryModal {
  open: boolean;
  side: 'A' | 'B';
  points: string;
  multiplier: 1 | 2 | 3;
  type: 'normal' | 'weis';
  isMatch: boolean;
}

const ENTRY_DEFAULT: EntryModal = {
  open: false, side: 'A', points: '', multiplier: 1, type: 'normal', isMatch: false,
};

// ===== Helpers =====
const fresh = (): SideState => ({ s100: 0, s50: 0, s20: 0, rest: null, weisTotal: 0 });

function sideTotal(s: SideState): number {
  return s.s100 * 100 + s.s50 * 50 + s.s20 * 20 + (s.rest ?? 0);
}

function splitTotal(total: number): Pick<SideState, 's100' | 's50' | 's20' | 'rest'> {
  const t = Math.max(0, Math.round(total));
  const s100 = Math.floor(t / 100);
  const r1 = t % 100;
  const s50 = Math.floor(r1 / 50);
  const r2 = r1 % 50;
  const s20 = Math.floor(r2 / 20);
  const rest = r2 % 20;
  return { s100, s50, s20, rest: rest > 0 ? rest : null };
}

function addToSide(side: SideState, pts: number, weisAdd: number): SideState {
  return { ...splitTotal(sideTotal(side) + pts), weisTotal: side.weisTotal + weisAdd };
}

function processEntry(
  state: GameState,
  entrySide: 'A' | 'B',
  rawPoints: number,
  mult: 1 | 2 | 3,
  type: 'normal' | 'weis',
  isMatch: boolean,
): GameState {
  const other: 'A' | 'B' = entrySide === 'A' ? 'B' : 'A';
  let myPts: number;
  let opponentPts: number;
  let myWeisAdd = 0;

  if (isMatch) {
    myPts = 257 * mult;
    opponentPts = 0;
  } else if (type === 'weis') {
    myPts = rawPoints * mult;
    opponentPts = 0;
    myWeisAdd = myPts;
  } else {
    myPts = rawPoints * mult;
    opponentPts = Math.max(0, 157 * mult - myPts);
  }

  const newEntry = addToSide(state[entrySide], myPts, myWeisAdd);
  const newOther = addToSide(state[other], opponentPts, 0);
  return { A: entrySide === 'A' ? newEntry : newOther, B: entrySide === 'B' ? newEntry : newOther };
}

// ===== Tally Mark Components =====
function TallyMark({ style }: { style?: CSSProperties }) {
  return (
    <span style={{
      width: '2.5px', height: '20px',
      background: 'rgba(15, 61, 32, 0.55)',
      borderRadius: '2px', display: 'inline-block',
      flexShrink: 0, ...style,
    }} />
  );
}

function TallyGroup5() {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', position: 'relative', gap: '2px', marginRight: '4px' }}>
      <TallyMark /><TallyMark /><TallyMark /><TallyMark />
      <span style={{
        position: 'absolute', width: 'calc(100% + 6px)', height: '2px',
        background: 'rgba(15, 61, 32, 0.55)', top: '50%', left: '-3px',
        transform: 'rotate(-68deg)', transformOrigin: 'center', borderRadius: '2px',
      }} />
    </span>
  );
}

function TallyGroup2() {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', position: 'relative', gap: '2px', marginRight: '3px' }}>
      <TallyMark /><TallyMark />
      <span style={{
        position: 'absolute', width: 'calc(100% + 4px)', height: '2px',
        background: 'rgba(15, 61, 32, 0.55)', top: '50%', left: '-2px',
        transform: 'rotate(-68deg)', transformOrigin: 'center', borderRadius: '2px',
      }} />
    </span>
  );
}

function renderTally(count: number, type: '100' | '50' | '20'): ReactElement[] {
  const items: ReactElement[] = [];
  if (type === '50') {
    const pairs = Math.floor(count / 2), single = count % 2;
    for (let i = 0; i < pairs; i++) items.push(<TallyGroup2 key={`p${i}`} />);
    for (let i = 0; i < single; i++) items.push(<TallyMark key={`s${i}`} style={{ marginRight: '3px' }} />);
  } else {
    const g5 = Math.floor(count / 5), rem = count % 5;
    for (let i = 0; i < g5; i++) items.push(<TallyGroup5 key={`g${i}`} />);
    for (let i = 0; i < rem; i++) items.push(<TallyMark key={`r${i}`} style={{ marginRight: '2px' }} />);
  }
  return items;
}

function ZShape() {
  return (
    <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', opacity: 0.13 }}
      viewBox="0 0 100 100" preserveAspectRatio="none">
      <line x1="4"  y1="15"  x2="96" y2="15"  stroke="#0f3d20" strokeWidth="5" strokeLinecap="round" />
      <line x1="96" y1="15"  x2="4"  y2="85"  stroke="#0f3d20" strokeWidth="5" strokeLinecap="round" />
      <line x1="4"  y1="85"  x2="96" y2="85"  stroke="#0f3d20" strokeWidth="5" strokeLinecap="round" />
    </svg>
  );
}

// ===== Zone (display only) =====
interface ZoneProps {
  label: string;
  count: number;
  type: '100' | '50' | '20';
}

function Zone({ label, count, type }: ZoneProps) {
  return (
    <div style={{
      position: 'relative',
      display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '2px',
      padding: '8px 6px 8px 8px', minHeight: '52px',
    }}>
      <span style={{
        position: 'absolute', top: '4px', left: '6px',
        fontSize: '9px', fontWeight: 600, color: 'rgba(15, 61, 32, 0.35)', lineHeight: 1,
      }}>{label}</span>
      {renderTally(count, type)}
    </div>
  );
}

// ===== BoardSide =====
interface BoardSideProps {
  name: string;
  sideState: SideState;
  rotated?: boolean;
  onNameChange: (name: string) => void;
  onOpenEntry: () => void;
}

function BoardSide({ name, sideState, rotated, onNameChange, onOpenEntry }: BoardSideProps) {
  return (
    <div className="p-4 space-y-2" style={{ transform: rotated ? 'rotate(180deg)' : undefined }}>
      <div className="flex gap-2">
        <input
          value={name}
          onChange={e => onNameChange(e.target.value)}
          maxLength={16}
          className="flex-1 min-w-0 bg-gray-100 rounded-xl px-4 py-2.5 text-center text-base font-semibold text-gray-900 outline-none focus:bg-gray-200 transition-colors"
        />
        <button
          onClick={onOpenEntry}
          className="bg-green-700 text-white rounded-xl px-4 py-2.5 font-semibold text-xl active:bg-green-800 transition-colors flex-shrink-0"
        >➕</button>
      </div>
      <div className="relative space-y-2">
        <ZShape />
        <Zone label="100er" count={sideState.s100} type="100" />
        <Zone label="50er"  count={sideState.s50}  type="50" />
        <Zone label="20er"  count={sideState.s20}  type="20" />
      </div>
      <div className="flex gap-2">
        <div
          className="bg-red-50 rounded-xl flex items-center justify-center min-h-[48px] relative"
          style={{ border: '1px dashed rgba(239,68,68,0.25)', width: '56px', flexShrink: 0 }}
        >
          <span className="absolute top-1.5 left-2 text-[9px] font-semibold text-red-300">Rest</span>
          <span className="text-base font-bold text-red-400">
            {sideState.rest !== null ? sideState.rest : ''}
          </span>
        </div>
        <div className="flex-1 bg-green-700 text-white rounded-xl flex flex-col items-center justify-center px-3 py-2 min-h-[48px]">
          <span className="text-3xl font-bold leading-tight">{sideTotal(sideState)}</span>
          {sideState.weisTotal > 0 && (
            <span className="text-[10px] text-green-200 font-medium leading-tight mt-0.5">
              Weis: {sideState.weisTotal}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ===== Score Divider =====
function ScoreDivider({ stateA, stateB, names }: {
  stateA: SideState; stateB: SideState; names: { A: string; B: string };
}) {
  const totalA = sideTotal(stateA);
  const totalB = sideTotal(stateB);
  const diff = totalA - totalB;

  let label: string;
  if (diff === 0 && totalA === 0) label = '🃏 Jass-Stats';
  else if (diff === 0)            label = 'Gleich';
  else if (diff > 0)              label = `${names.A}  +${diff}`;
  else                            label = `${names.B}  +${Math.abs(diff)}`;

  return (
    <div className="flex items-center gap-3 bg-green-700 px-4 py-2.5">
      <div className="flex-1 h-px bg-white/20" />
      <span className="text-xs font-semibold text-white/90 whitespace-nowrap">{label}</span>
      <div className="flex-1 h-px bg-white/20" />
    </div>
  );
}

// ===== Numpad =====
function Numpad({ onDigit, onBackspace }: { onDigit: (d: number) => void; onBackspace: () => void }) {
  const btnCls = 'bg-gray-100 text-gray-800 rounded-xl py-3.5 font-semibold text-lg active:bg-gray-200 transition-colors';
  return (
    <div className="grid grid-cols-3 gap-2">
      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
        <button key={n} className={btnCls} onClick={() => onDigit(n)}>{n}</button>
      ))}
      <button className={`${btnCls} col-span-2`} onClick={() => onDigit(0)}>0</button>
      <button className="bg-gray-100 text-red-400 rounded-xl py-3.5 font-semibold active:bg-gray-200 transition-colors" onClick={onBackspace}>⌫</button>
    </div>
  );
}

// ===== Persistence =====
const STORAGE_KEY = 'jasstafel-v1';

function loadFromStorage(): { state: GameState; names: { A: string; B: string } } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Migration: add weisTotal if missing from old data
      if (parsed.state?.A) parsed.state.A.weisTotal ??= 0;
      if (parsed.state?.B) parsed.state.B.weisTotal ??= 0;
      return parsed;
    }
  } catch { /* ignore */ }
  return { state: { A: fresh(), B: fresh() }, names: { A: 'Team 1', B: 'Team 2' } };
}

function saveToStorage(state: GameState, names: { A: string; B: string }) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ state, names })); } catch { /* ignore */ }
}

// ===== Main Page =====
export default function Tafel() {
  const [state, setState]   = useState<GameState>(() => loadFromStorage().state);
  const [hist, setHist]     = useState<GameState[]>([]);
  const [names, setNames]   = useState(() => loadFromStorage().names);
  const [entry, setEntry]   = useState<EntryModal>(ENTRY_DEFAULT);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => { saveToStorage(state, names); }, [state, names]);

  const pushHist = (s: GameState) =>
    setHist(prev => [...prev, JSON.parse(JSON.stringify(s))].slice(-60));

  // Round entry
  const openEntry = (side: 'A' | 'B') =>
    setEntry({ ...ENTRY_DEFAULT, open: true, side });

  const appendDigit = (d: number) => {
    setEntry(e => {
      if (e.points.length >= 3) return e;
      if (e.points === '0') return { ...e, points: d === 0 ? '0' : `${d}` };
      return { ...e, points: e.points + d };
    });
  };

  const commitEntry = () => {
    const rawPoints = parseInt(entry.points, 10) || 0;
    if (!entry.isMatch && rawPoints < 0) return;
    pushHist(state);
    setState(prev => processEntry(prev, entry.side, rawPoints, entry.multiplier, entry.type, entry.isMatch));
    setEntry(ENTRY_DEFAULT);
  };

  // Preview calculations
  const rawPts = parseInt(entry.points, 10) || 0;
  const previewMyPts  = entry.isMatch ? 257 * entry.multiplier : rawPts * entry.multiplier;
  const previewOppPts = entry.isMatch || entry.type === 'weis'
    ? 0
    : Math.max(0, 157 * entry.multiplier - rawPts * entry.multiplier);
  const myName  = entry.side === 'A' ? names.A : names.B;
  const oppName = entry.side === 'A' ? names.B : names.A;
  const canCommit = entry.isMatch || entry.points !== '';

  const undo = () => {
    if (!hist.length) return;
    setState(hist[hist.length - 1]);
    setHist(prev => prev.slice(0, -1));
    navigator.vibrate?.(20);
  };

  const resetAll = () => {
    pushHist(state);
    setState({ A: fresh(), B: fresh() });
    setConfirmOpen(false);
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setEntry(ENTRY_DEFAULT);
        setConfirmOpen(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const hasWeis = state.A.weisTotal > 0 || state.B.weisTotal > 0;

  return (
    <div className="space-y-4">

      {/* ── Board ── */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <BoardSide
          name={names.B} sideState={state.B} rotated
          onNameChange={n => setNames(prev => ({ ...prev, B: n }))}
          onOpenEntry={() => openEntry('B')}
        />
        <ScoreDivider stateA={state.A} stateB={state.B} names={names} />
        <BoardSide
          name={names.A} sideState={state.A}
          onNameChange={n => setNames(prev => ({ ...prev, A: n }))}
          onOpenEntry={() => openEntry('A')}
        />
      </div>

      {/* ── Action buttons ── */}
      <div className="flex gap-3">
        <button
          onClick={undo}
          disabled={hist.length === 0}
          className="flex-1 bg-green-700 text-white rounded-2xl py-4 font-semibold text-base disabled:opacity-40 active:bg-green-800 transition-colors"
        >
          ↩ Rückgängig
        </button>
        <button
          onClick={() => setConfirmOpen(true)}
          className="bg-gray-100 text-red-400 rounded-2xl py-4 px-6 font-semibold text-base active:bg-gray-200 transition-colors"
        >
          🗑 Reset
        </button>
      </div>

      {/* ── Weis-Übersicht ── */}
      {hasWeis && (
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <p className="text-xs font-semibold text-gray-500 tracking-wide mb-3">WEIS-ÜBERSICHT</p>
          <div className="grid grid-cols-2 gap-3">
            {(['A', 'B'] as const).map(side => (
              <div key={side} className="text-center">
                <p className="text-xs text-gray-500 font-medium mb-1 truncate">
                  {side === 'A' ? names.A : names.B}
                </p>
                <p className="text-2xl font-bold text-purple-600">{state[side].weisTotal}</p>
                <p className="text-xs text-gray-400">Weis-Punkte</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════
           RUNDE-EINGABE BOTTOM SHEET
          ══════════════════════════════════════ */}
      {entry.open && (
        <div
          className="fixed inset-0 bg-black/40 z-[60] flex items-end"
          onClick={() => setEntry(ENTRY_DEFAULT)}
        >
          <div
            className="bg-white rounded-t-3xl w-full max-w-lg mx-auto pb-safe overflow-y-auto max-h-[92vh]"
            onClick={e => e.stopPropagation()}
          >
            {/* Drag handle */}
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mt-3 mb-4" />

            <div className="px-5 space-y-4 pb-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900">Runde — {myName}</h3>
                <button
                  onClick={() => setEntry(ENTRY_DEFAULT)}
                  className="text-gray-400 text-2xl leading-none active:text-gray-600"
                >×</button>
              </div>

              {/* Match Toggle */}
              <button
                onClick={() => setEntry(e => ({ ...e, isMatch: !e.isMatch, points: '' }))}
                className={`w-full py-3.5 rounded-2xl font-semibold text-base transition-colors ${
                  entry.isMatch
                    ? 'bg-amber-500 text-white active:bg-amber-600'
                    : 'bg-gray-100 text-gray-600 active:bg-gray-200'
                }`}
              >
                {entry.isMatch ? '⚡ Match — 257 Punkte' : '⚡ Match'}
              </button>

              {/* Points input — hidden when Match */}
              {!entry.isMatch && (
                <>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 tracking-wide mb-2">MEINE PUNKTE</p>
                    <div className="bg-gray-100 rounded-xl px-4 py-3 text-3xl font-bold text-center text-gray-900 min-h-[60px] flex items-center justify-center">
                      {entry.points !== ''
                        ? entry.points
                        : <span className="text-gray-300 text-2xl">0</span>
                      }
                    </div>
                  </div>
                  <Numpad
                    onDigit={appendDigit}
                    onBackspace={() => setEntry(e => ({ ...e, points: e.points.slice(0, -1) }))}
                  />
                </>
              )}

              {/* Multiplier */}
              <div>
                <p className="text-xs font-semibold text-gray-500 tracking-wide mb-2">MULTIPLIKATOR</p>
                <div className="flex gap-2">
                  {([1, 2, 3] as const).map(m => (
                    <button
                      key={m}
                      onClick={() => setEntry(e => ({ ...e, multiplier: m }))}
                      className={`flex-1 py-3 rounded-xl font-bold text-base transition-colors ${
                        entry.multiplier === m
                          ? 'bg-green-700 text-white'
                          : 'bg-gray-100 text-gray-700 active:bg-gray-200'
                      }`}
                    >{m}×</button>
                  ))}
                </div>
              </div>

              {/* Type: Normal / Weis — hidden for Match */}
              {!entry.isMatch && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 tracking-wide mb-2">ART</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEntry(e => ({ ...e, type: 'normal' }))}
                      className={`flex-1 py-3 rounded-xl font-semibold transition-colors ${
                        entry.type === 'normal'
                          ? 'bg-green-700 text-white'
                          : 'bg-gray-100 text-gray-600 active:bg-gray-200'
                      }`}
                    >Normal</button>
                    <button
                      onClick={() => setEntry(e => ({ ...e, type: 'weis' }))}
                      className={`flex-1 py-3 rounded-xl font-semibold transition-colors ${
                        entry.type === 'weis'
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-100 text-gray-600 active:bg-gray-200'
                      }`}
                    >Weis</button>
                  </div>
                </div>
              )}

              {/* Preview */}
              <div className="bg-gray-50 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">{myName} erhält</span>
                  <span className="font-bold text-gray-900 text-base">
                    {previewMyPts} Pkt
                    {entry.type === 'weis' && !entry.isMatch && (
                      <span className="text-xs text-purple-500 font-semibold ml-1.5">(Weis)</span>
                    )}
                    {entry.isMatch && (
                      <span className="text-xs text-amber-500 font-semibold ml-1.5">(Match)</span>
                    )}
                  </span>
                </div>
                <div className="h-px bg-gray-200" />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">{oppName} erhält</span>
                  <span className={`font-bold text-base ${previewOppPts === 0 ? 'text-gray-300' : 'text-gray-900'}`}>
                    {previewOppPts} Pkt
                    {previewOppPts === 0 && (entry.isMatch || entry.type === 'weis') && (
                      <span className="text-xs text-gray-400 font-normal ml-1.5">
                        {entry.isMatch ? '(Match)' : '(Weis)'}
                      </span>
                    )}
                  </span>
                </div>
              </div>

              {/* Confirm / Cancel */}
              <div className="flex gap-3">
                <button
                  onClick={() => setEntry(ENTRY_DEFAULT)}
                  className="flex-1 bg-gray-100 text-gray-600 rounded-2xl py-4 font-semibold active:bg-gray-200 transition-colors"
                >Abbrechen</button>
                <button
                  onClick={commitEntry}
                  disabled={!canCommit}
                  className="flex-[2] bg-green-700 text-white rounded-2xl py-4 font-semibold disabled:opacity-40 active:bg-green-800 transition-colors"
                >Eintragen</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════
           RESET BESTÄTIGUNG
          ══════════════════════════════════════ */}
      {confirmOpen && (
        <div className="fixed inset-0 bg-black/40 z-[60] flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-xs shadow-xl space-y-5">
            <p className="text-lg font-bold text-gray-900 text-center">Tafel wirklich löschen?</p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmOpen(false)}
                className="flex-1 bg-gray-100 text-gray-700 rounded-2xl py-3.5 font-semibold active:bg-gray-200"
              >Nein</button>
              <button
                onClick={resetAll}
                className="flex-1 bg-red-500 text-white rounded-2xl py-3.5 font-semibold active:bg-red-600"
              >Ja, löschen</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

import { useState, useRef, useEffect, CSSProperties } from 'react';

// ===== Types =====
interface SideState {
  s100: number;
  s50: number;
  s20: number;
  rest: number | null;
}

interface GameState {
  A: SideState;
  B: SideState;
}

// ===== Helpers =====
const fresh = (): SideState => ({ s100: 0, s50: 0, s20: 0, rest: null });

function sideTotal(s: SideState): number {
  return s.s100 * 100 + s.s50 * 50 + s.s20 * 20 + (s.rest ?? 0);
}

// ===== Tally Mark Components =====
function TallyMark({ style }: { style?: CSSProperties }) {
  return (
    <span style={{
      width: '2.5px', height: '20px',
      background: 'rgba(240,235,220,0.88)',
      borderRadius: '2px', display: 'inline-block',
      boxShadow: '1px 1px 2px rgba(0,0,0,0.3)',
      flexShrink: 0,
      ...style,
    }} />
  );
}

function TallyGroup5() {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      position: 'relative', gap: '2px', marginRight: '4px',
    }}>
      <TallyMark /><TallyMark /><TallyMark /><TallyMark /><TallyMark />
      <span style={{
        position: 'absolute',
        width: 'calc(100% + 6px)', height: '2.5px',
        background: 'rgba(240,235,220,0.88)',
        top: '50%', left: '-3px',
        transform: 'rotate(-68deg)', transformOrigin: 'center',
        borderRadius: '2px', boxShadow: '1px 1px 2px rgba(0,0,0,0.3)',
      }} />
    </span>
  );
}

function TallyGroup2() {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      position: 'relative', gap: '2px', marginRight: '3px',
    }}>
      <TallyMark /><TallyMark />
      <span style={{
        position: 'absolute',
        width: 'calc(100% + 4px)', height: '2.5px',
        background: 'rgba(240,235,220,0.88)',
        top: '50%', left: '-2px',
        transform: 'rotate(-68deg)', transformOrigin: 'center',
        borderRadius: '2px', boxShadow: '1px 1px 2px rgba(0,0,0,0.3)',
      }} />
    </span>
  );
}

function renderTally(count: number, type: '100' | '50' | '20') {
  const items: JSX.Element[] = [];
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

// ===== Z Shape (decorative chalk Z behind tally zones) =====
function ZShape() {
  return (
    <svg
      style={{
        position: 'absolute', inset: 0,
        width: '100%', height: '100%',
        pointerEvents: 'none', opacity: 0.08,
      }}
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
    >
      <line x1="4" y1="7" x2="96" y2="7"  stroke="white" strokeWidth="5" strokeLinecap="round" />
      <line x1="96" y1="7" x2="4"  y2="93" stroke="white" strokeWidth="5" strokeLinecap="round" />
      <line x1="4" y1="93" x2="96" y2="93" stroke="white" strokeWidth="5" strokeLinecap="round" />
    </svg>
  );
}

// ===== Zone (tally area with tap / long-press) =====
interface ZoneProps {
  label: string;
  count: number;
  type: '100' | '50' | '20';
  bg: string;
  border: string;
  onAdd: () => void;
  onRemove: () => void;
}

function Zone({ label, count, type, bg, border, onAdd, onRemove }: ZoneProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didLong = useRef(false);

  const startLong = () => {
    didLong.current = false;
    timerRef.current = setTimeout(() => {
      didLong.current = true;
      onRemove();
      navigator.vibrate?.(40);
    }, 450);
  };

  const cancel = () => { if (timerRef.current) clearTimeout(timerRef.current); };
  const tap    = () => { if (!didLong.current) onAdd(); };

  return (
    <div
      style={{
        background: bg, border: `1px dashed ${border}`,
        borderRadius: '3px', position: 'relative',
        cursor: 'pointer', userSelect: 'none',
        WebkitTapHighlightColor: 'transparent',
        display: 'flex', alignItems: 'center',
        flexWrap: 'wrap', gap: '2px',
        padding: '5px 4px 5px 6px', minHeight: '42px',
      }}
      onTouchStart={e => { e.preventDefault(); startLong(); }}
      onTouchEnd={e => { e.preventDefault(); cancel(); tap(); }}
      onTouchCancel={cancel}
      onMouseDown={startLong}
      onMouseUp={() => { cancel(); tap(); }}
      onMouseLeave={cancel}
    >
      <span style={{
        position: 'absolute', top: '2px', left: '4px',
        fontSize: '0.5rem', color: 'rgba(255,255,255,0.3)',
        fontFamily: "'Patrick Hand', cursive",
        pointerEvents: 'none', lineHeight: 1,
      }}>{label}</span>
      {renderTally(count, type)}
    </div>
  );
}

// ===== BoardSide =====
interface BoardSideProps {
  name: string;
  sideState: SideState;
  side: 'A' | 'B';
  rotated?: boolean;
  onChange: (side: 'A' | 'B', field: 's100' | 's50' | 's20', delta: 1 | -1) => void;
  onOpenRest: (side: 'A' | 'B') => void;
  onNameChange: (name: string) => void;
}

function BoardSide({ name, sideState, side, rotated, onChange, onOpenRest, onNameChange }: BoardSideProps) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      padding: '8px 10px 8px',
      gap: '5px',
      transform: rotated ? 'rotate(180deg)' : undefined,
    }}>
      {/* Player name input */}
      <input
        value={name}
        onChange={e => onNameChange(e.target.value)}
        maxLength={16}
        style={{
          fontFamily: "'Permanent Marker', cursive",
          color: 'rgba(255,255,255,0.85)',
          fontSize: 'clamp(0.85rem, 3vw, 1.05rem)',
          textAlign: 'center', letterSpacing: '1px',
          background: 'transparent',
          border: 'none',
          borderBottom: '1px dashed rgba(255,255,255,0.2)',
          outline: 'none',
          width: '100%',
          padding: '2px 4px',
          WebkitTapHighlightColor: 'transparent',
        }}
      />

      {/* Tally zones with Z overlay */}
      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '5px' }}>
        <ZShape />
        <Zone
          label="100er" count={sideState.s100} type="100"
          bg="rgba(66,133,244,0.18)" border="rgba(66,133,244,0.4)"
          onAdd={() => onChange(side, 's100', 1)}
          onRemove={() => onChange(side, 's100', -1)}
        />
        <Zone
          label="50er" count={sideState.s50} type="50"
          bg="rgba(52,168,83,0.18)" border="rgba(52,168,83,0.4)"
          onAdd={() => onChange(side, 's50', 1)}
          onRemove={() => onChange(side, 's50', -1)}
        />
        <Zone
          label="20er" count={sideState.s20} type="20"
          bg="rgba(251,188,5,0.18)" border="rgba(251,188,5,0.4)"
          onAdd={() => onChange(side, 's20', 1)}
          onRemove={() => onChange(side, 's20', -1)}
        />
      </div>

      {/* Rest + Total row */}
      <div style={{ display: 'flex', gap: '5px', alignItems: 'stretch' }}>
        {/* Rest zone */}
        <div
          style={{
            flex: 1,
            background: 'rgba(234,67,53,0.15)',
            border: '1px dashed rgba(234,67,53,0.4)',
            borderRadius: '3px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            minHeight: '40px', position: 'relative',
            WebkitTapHighlightColor: 'transparent',
          }}
          onClick={() => onOpenRest(side)}
        >
          <span style={{
            position: 'absolute', top: '2px', left: '4px',
            fontSize: '0.5rem', color: 'rgba(255,150,130,0.35)',
            fontFamily: "'Patrick Hand', cursive",
            pointerEvents: 'none', lineHeight: 1,
          }}>Rest</span>
          <span style={{
            fontFamily: "'Permanent Marker', cursive",
            color: 'rgba(255,180,160,0.95)',
            fontSize: 'clamp(1.1rem, 4vw, 1.5rem)',
            textShadow: '0 0 8px rgba(234,67,53,0.4)',
          }}>
            {sideState.rest !== null ? sideState.rest : ''}
          </span>
        </div>

        {/* Total */}
        <div style={{
          background: 'rgba(0,0,0,0.35)',
          borderRadius: '3px', textAlign: 'center',
          padding: '5px 10px',
          fontFamily: "'Permanent Marker', cursive",
          color: 'rgba(255,255,255,0.9)',
          fontSize: 'clamp(1.0rem, 3.5vw, 1.3rem)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          minWidth: '80px',
        }}>
          = {sideTotal(sideState)}
        </div>
      </div>
    </div>
  );
}

// ===== Persistence helpers =====
const STORAGE_KEY = 'jasstafel-v1';

function loadFromStorage(): { state: GameState; names: { A: string; B: string } } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { state: { A: fresh(), B: fresh() }, names: { A: 'Team 1', B: 'Team 2' } };
}

function saveToStorage(state: GameState, names: { A: string; B: string }) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ state, names }));
  } catch { /* ignore */ }
}

// ===== Main Page =====
export default function Tafel() {
  const [state, setState] = useState<GameState>(() => loadFromStorage().state);
  const [hist, setHist] = useState<GameState[]>([]);
  const [names, setNames] = useState(() => loadFromStorage().names);
  const [restModal, setRestModal] = useState<{ open: boolean; side: 'A' | 'B' }>({ open: false, side: 'A' });
  const [restVal, setRestVal] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const restInputRef = useRef<HTMLInputElement>(null);

  // Persist on every change
  useEffect(() => { saveToStorage(state, names); }, [state, names]);

  const pushHist = (s: GameState) =>
    setHist(prev => [...prev, JSON.parse(JSON.stringify(s))].slice(-60));

  const change = (side: 'A' | 'B', field: 's100' | 's50' | 's20', delta: 1 | -1) => {
    pushHist(state);
    setState(prev => ({
      ...prev,
      [side]: { ...prev[side], [field]: Math.max(0, prev[side][field] + delta) },
    }));
  };

  const openRest = (side: 'A' | 'B') => {
    pushHist(state);
    setRestVal('');
    setRestModal({ open: true, side });
    setTimeout(() => restInputRef.current?.focus(), 120);
  };

  const commitRest = () => {
    const v = parseInt(restVal, 10);
    if (isNaN(v)) return;
    setState(prev => ({
      ...prev,
      [restModal.side]: {
        ...prev[restModal.side],
        rest: (prev[restModal.side].rest ?? 0) + v,
      },
    }));
    setRestModal(m => ({ ...m, open: false }));
  };

  const undo = () => {
    if (!hist.length) return;
    setState(hist[hist.length - 1]);
    setHist(prev => prev.slice(0, -1));
  };

  const resetAll = () => {
    pushHist(state);
    setState({ A: fresh(), B: fresh() });
    setConfirmOpen(false);
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setRestModal(m => ({ ...m, open: false }));
        setConfirmOpen(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // App green palette
  const G = {
    outerBg:    '#0f3d20',
    frameBg:    'linear-gradient(135deg, #14532d, #166534, #14532d)',
    boardBg:    '#0b2918',
    divider:    'rgba(255,255,255,0.55)',
    btnUndo:    '#166534',
    btnReset:   '#7f1d1d',
    modalBg:    '#0d2818',
  };

  const btnBase: CSSProperties = {
    flex: 1, padding: '10px 8px',
    fontFamily: "'Permanent Marker', cursive",
    fontSize: 'clamp(0.75rem, 2.5vw, 0.95rem)',
    border: '2px solid rgba(255,255,255,0.15)',
    borderRadius: '6px', cursor: 'pointer',
    letterSpacing: '0.5px', color: '#e8f5e9',
  };

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Permanent+Marker&family=Patrick+Hand&display=swap');`}</style>

      {/* Full-bleed green background */}
      <div style={{
        margin: '-1.5rem -1rem 0',
        backgroundImage: `
          repeating-linear-gradient(90deg, rgba(0,0,0,0.07) 0px, rgba(0,0,0,0.07) 2px, transparent 2px, transparent 40px),
          repeating-linear-gradient(0deg, rgba(0,0,0,0.07) 0px, rgba(0,0,0,0.07) 2px, transparent 2px, transparent 40px)
        `,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '12px', paddingBottom: '80px', gap: '10px',
        minHeight: 'calc(100dvh - 60px)',
      }}>

        {/* Board frame */}
        <div style={{
          background: G.frameBg,
          borderRadius: '8px', padding: '12px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5), inset 0 2px 4px rgba(255,255,255,0.08)',
          width: '100%', maxWidth: '480px',
        }}>
          {/* Chalkboard — vertical layout */}
          <div style={{
            background: G.boardBg,
            backgroundImage: 'radial-gradient(ellipse at 50% 20%, rgba(255,255,255,0.02) 0%, transparent 60%)',
            borderRadius: '4px',
            display: 'flex', flexDirection: 'column',
            position: 'relative', overflow: 'hidden',
          }}>
            {/* Side B — Dir (top, rotated 180° for opposite player) */}
            <BoardSide
              name={names.B} sideState={state.B} side="B" rotated
              onChange={change} onOpenRest={openRest}
              onNameChange={n => setNames(prev => ({ ...prev, B: n }))}
            />

            {/* Horizontal divider */}
            <div style={{
              height: '3px',
              background: G.divider,
              margin: '0 0',
            }} />

            {/* Side A — Mir (bottom, normal) */}
            <BoardSide
              name={names.A} sideState={state.A} side="A"
              onChange={change} onOpenRest={openRest}
              onNameChange={n => setNames(prev => ({ ...prev, A: n }))}
            />
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '8px', width: '100%', maxWidth: '480px' }}>
          <button style={{ ...btnBase, background: G.btnUndo }}  onClick={undo}>
            ↩ Rückgängig
          </button>
          <button style={{ ...btnBase, background: G.btnReset }} onClick={() => setConfirmOpen(true)}>
            🗑 Alles löschen
          </button>
        </div>
      </div>

      {/* Rest Modal */}
      {restModal.open && (
        <div
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.72)', zIndex: 50,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          onClick={() => setRestModal(m => ({ ...m, open: false }))}
        >
          <div
            style={{
              background: G.modalBg,
              border: '2px solid rgba(255,255,255,0.15)',
              borderRadius: '10px', padding: '18px',
              width: 'min(310px, 93vw)',
              display: 'flex', flexDirection: 'column', gap: '12px',
              boxShadow: '0 16px 48px rgba(0,0,0,0.8)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <h2 style={{
              fontFamily: "'Permanent Marker', cursive",
              color: '#e8f5e9', fontSize: '1.05rem', textAlign: 'center',
            }}>
              {restModal.side === 'A' ? names.A : names.B} – Restzahl
            </h2>
            <div style={{
              background: 'rgba(255,255,255,0.05)',
              borderRadius: '6px', padding: '7px 10px',
              fontFamily: "'Patrick Hand', cursive",
              color: 'rgba(255,255,255,0.5)',
              fontSize: '0.8rem', lineHeight: 1.4,
            }}>
              Positiv (z.B. 9) oder negativ (z.B. -4). Wird zur bestehenden Restzahl addiert.
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                ref={restInputRef}
                type="number" inputMode="numeric"
                value={restVal}
                onChange={e => setRestVal(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && commitRest()}
                placeholder="z.B. 9 oder -4"
                style={{
                  flex: 1,
                  background: 'rgba(255,255,255,0.07)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '6px', color: '#e8f5e9',
                  fontFamily: "'Permanent Marker', cursive",
                  fontSize: '1.2rem', padding: '8px 10px',
                  textAlign: 'center', outline: 'none',
                }}
              />
              <button
                style={{
                  padding: '10px 14px',
                  fontFamily: "'Permanent Marker', cursive",
                  fontSize: '0.9rem', border: 'none',
                  borderRadius: '6px', cursor: 'pointer',
                  color: 'white', background: '#166534',
                }}
                onClick={commitRest}
              >✓</button>
            </div>
            <div
              style={{
                background: 'rgba(80,80,80,0.35)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '6px', color: 'rgba(255,255,255,0.45)',
                fontFamily: "'Patrick Hand', cursive",
                fontSize: '0.9rem', padding: '8px',
                cursor: 'pointer', textAlign: 'center',
              }}
              onClick={() => setRestModal(m => ({ ...m, open: false }))}
            >Abbrechen</div>
          </div>
        </div>
      )}

      {/* Confirm Reset */}
      {confirmOpen && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.7)', zIndex: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            background: G.modalBg,
            border: '2px solid rgba(255,255,255,0.15)',
            borderRadius: '10px', padding: '22px', textAlign: 'center',
            display: 'flex', flexDirection: 'column', gap: '14px',
            width: 'min(270px, 90vw)',
          }}>
            <p style={{ fontFamily: "'Permanent Marker', cursive", color: '#e8f5e9', fontSize: '1.05rem' }}>
              Tafel wirklich löschen?
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                style={{
                  flex: 1, padding: '10px',
                  fontFamily: "'Permanent Marker', cursive",
                  border: 'none', borderRadius: '6px',
                  cursor: 'pointer', fontSize: '0.95rem',
                  background: 'rgba(100,100,100,0.4)', color: '#ccc',
                }}
                onClick={() => setConfirmOpen(false)}
              >Nein</button>
              <button
                style={{
                  flex: 1, padding: '10px',
                  fontFamily: "'Permanent Marker', cursive",
                  border: 'none', borderRadius: '6px',
                  cursor: 'pointer', fontSize: '0.95rem',
                  background: '#7f1d1d', color: 'white',
                }}
                onClick={resetAll}
              >Ja</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

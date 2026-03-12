import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../AppContext';
import { addSession } from '../store';
import { CHRITZ_LABELS, CHRITZ_ICONS } from '../types';
import type { ChritzEntry, ChritzType } from '../types';

type Step = 'teams' | 'chritz';

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

const SESSION_DRAFT_KEY = 'neuer-abend-draft-v2';

interface Draft {
  step: Step;
  date: string;
  team0: string[];
  team1: string[];
  chritz: ChritzEntry[];
}

function loadDraft(): Draft | null {
  try {
    const raw = localStorage.getItem(SESSION_DRAFT_KEY);
    if (!raw) return null;
    const d = JSON.parse(raw) as Draft;
    if (d.step !== 'teams' && d.step !== 'chritz') d.step = 'teams';
    return d;
  } catch { return null; }
}

function saveDraft(draft: Draft) {
  try { localStorage.setItem(SESSION_DRAFT_KEY, JSON.stringify(draft)); } catch { /* ignore */ }
}

function clearDraft() {
  try { localStorage.removeItem(SESSION_DRAFT_KEY); } catch { /* ignore */ }
}

export default function NewSession() {
  const { data, update } = useApp();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>(() => loadDraft()?.step ?? 'teams');
  const [date, setDate] = useState(() => loadDraft()?.date ?? new Date().toISOString().slice(0, 10));
  const [team0, setTeam0] = useState<string[]>(() => loadDraft()?.team0 ?? []);
  const [team1, setTeam1] = useState<string[]>(() => loadDraft()?.team1 ?? []);
  const [chritz, setChritz] = useState<ChritzEntry[]>(() => loadDraft()?.chritz ?? []);

  useEffect(() => {
    saveDraft({ step, date, team0, team1, chritz });
  }, [step, date, team0, team1, chritz]);

  const players = data.players;

  function togglePlayer(playerId: string, teamIndex: 0 | 1) {
    const otherTeam = teamIndex === 0 ? team1 : team0;
    const setTeam = teamIndex === 0 ? setTeam0 : setTeam1;
    const setOther = teamIndex === 0 ? setTeam1 : setTeam0;

    if (otherTeam.includes(playerId)) {
      setOther(otherTeam.filter((id) => id !== playerId));
    }

    const currentTeam = teamIndex === 0 ? team0 : team1;
    if (currentTeam.includes(playerId)) {
      setTeam(currentTeam.filter((id) => id !== playerId));
    } else if (currentTeam.length < 2) {
      setTeam([...currentTeam, playerId]);
    }
  }

  function addChritz(type: ChritzType, teamIndex: 0 | 1) {
    setChritz([...chritz, { id: generateId(), type, teamIndex }]);
  }

  function removeChritz(id: string) {
    setChritz(chritz.filter((c) => c.id !== id));
  }

  function handleSave() {
    const newData = addSession(data, { date, teams: [team0, team1], chritz });
    update(newData);
    clearDraft();
    navigate('/abende');
  }

  const teamsComplete = team0.length === 2 && team1.length === 2;
  const playerName = (id: string) => players.find((p) => p.id === id)?.name ?? '?';

  const steps: Step[] = ['teams', 'chritz'];

  return (
    <div className="space-y-4 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">Neuer Abend</h2>
        <div className="flex gap-1.5 items-center">
          {steps.map((s, i) => (
            <div
              key={s}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                s === step ? 'w-6 bg-green-700' :
                i < steps.indexOf(step) ? 'w-1.5 bg-green-400' :
                'w-1.5 bg-gray-200'
              }`}
            />
          ))}
        </div>
      </div>

      {/* ── Schritt 1: Datum + Teams ── */}
      {step === 'teams' && (
        <div className="space-y-3">
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <label className="block text-xs font-semibold text-gray-500 mb-2 tracking-wide">DATUM</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-gray-100 rounded-xl px-4 py-3 text-base outline-none focus:bg-gray-200 transition-colors"
            />
          </div>

          {players.length < 4 ? (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-amber-800 text-sm">
              Mindestens 4 Spieler werden benötigt. Gehe zu «Spieler» um Spieler hinzuzufügen.
            </div>
          ) : (
            <>
              {([0, 1] as const).map((ti) => {
                const team = ti === 0 ? team0 : team1;
                return (
                  <div key={ti} className="bg-white rounded-2xl shadow-sm p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold text-gray-500 tracking-wide">TEAM {ti + 1}</span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        team.length === 2 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'
                      }`}>{team.length}/2</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {players.map((p) => {
                        const inThisTeam = team.includes(p.id);
                        const inOtherTeam = (ti === 0 ? team1 : team0).includes(p.id);
                        const full = team.length >= 2 && !inThisTeam;
                        return (
                          <button
                            key={p.id}
                            onClick={() => togglePlayer(p.id, ti)}
                            disabled={full || inOtherTeam}
                            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                              inThisTeam
                                ? 'bg-green-700 text-white'
                                : inOtherTeam || full
                                ? 'bg-gray-100 text-gray-300'
                                : 'bg-gray-100 text-gray-700 active:bg-gray-200'
                            }`}
                          >
                            {p.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              <button
                onClick={() => setStep('chritz')}
                disabled={!teamsComplete}
                className="w-full bg-green-700 text-white rounded-2xl py-4 font-semibold text-base disabled:opacity-40 transition-opacity active:bg-green-800"
              >
                Weiter →
              </button>
            </>
          )}
        </div>
      )}

      {/* ── Schritt 2: Chritz + Speichern ── */}
      {step === 'chritz' && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {([0, 1] as const).map((ti) => {
              const team = ti === 0 ? team0 : team1;
              const teamChritz = chritz.filter((c) => c.teamIndex === ti);
              const total = teamChritz.reduce((s, c) => s + (c.type === 'sieg' ? 2 : 1), 0);
              return (
                <div key={ti} className="bg-white rounded-2xl shadow-sm p-4">
                  <div className="flex items-start justify-between mb-1">
                    <p className="text-xs font-semibold text-gray-500 tracking-wide">TEAM {ti + 1}</p>
                    {total > 0 && (
                      <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full leading-5">
                        {total} Chritz
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-bold text-gray-900 mb-3">{team.map(playerName).join(' & ')}</p>
                  {teamChritz.length > 0 && (
                    <div className="mb-3 space-y-1 border-b border-gray-100 pb-3">
                      {(['match', 'bergpreis', 'sieg'] as ChritzType[]).map((type) => {
                        const count = teamChritz.filter((c) => c.type === type).length;
                        if (count === 0) return null;
                        return (
                          <div key={type} className="flex items-center justify-between text-xs text-gray-600">
                            <span>{CHRITZ_ICONS[type]} {CHRITZ_LABELS[type]}</span>
                            <span className="font-bold text-gray-800">×{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  <div className="space-y-2">
                    {(['match', 'bergpreis', 'sieg'] as ChritzType[]).map((type) => (
                      <button
                        key={type}
                        onClick={() => addChritz(type, ti)}
                        className="w-full flex items-center gap-2 px-3 py-2.5 bg-gray-100 active:bg-gray-200 rounded-xl text-sm font-medium transition-colors"
                      >
                        <span className="text-base">{CHRITZ_ICONS[type]}</span>
                        <span className="text-gray-700">{CHRITZ_LABELS[type]}</span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {chritz.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm p-4">
              <p className="text-xs font-semibold text-gray-500 tracking-wide mb-3">EINGETRAGEN ({chritz.length})</p>
              <div className="space-y-1.5">
                {chritz.map((c) => (
                  <div key={c.id} className="flex items-center justify-between py-1.5 px-3 bg-gray-50 rounded-xl">
                    <span className="text-sm text-gray-700">
                      {CHRITZ_ICONS[c.type]} {CHRITZ_LABELS[c.type]}
                      <span className="ml-2 text-gray-400 text-xs">→ Team {c.teamIndex + 1}</span>
                    </span>
                    <button
                      onClick={() => removeChritz(c.id)}
                      className="text-gray-400 active:text-red-500 text-xl leading-none ml-3 transition-colors"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => setStep('teams')}
              className="flex-1 bg-gray-100 text-gray-700 rounded-2xl py-4 font-semibold text-base active:bg-gray-200 transition-colors"
            >
              ← Zurück
            </button>
            <button
              onClick={handleSave}
              className="flex-[2] bg-green-700 text-white rounded-2xl py-4 font-semibold text-base active:bg-green-800 transition-colors"
            >
              Speichern
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

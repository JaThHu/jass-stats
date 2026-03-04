import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../AppContext';
import { addSession } from '../store';
import { CHRITZ_LABELS, CHRITZ_ICONS } from '../types';
import type { ChritzEntry, ChritzType } from '../types';

type Step = 'datum' | 'teams' | 'chritz' | 'bestaetigen';

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

export default function NewSession() {
  const { data, update } = useApp();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>('datum');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [team0, setTeam0] = useState<string[]>([]);
  const [team1, setTeam1] = useState<string[]>([]);
  const [chritz, setChritz] = useState<ChritzEntry[]>([]);

  const players = data.players;

  // Team assignment helpers
  function togglePlayer(playerId: string, teamIndex: 0 | 1) {
    const otherTeam = teamIndex === 0 ? team1 : team0;
    const setTeam = teamIndex === 0 ? setTeam0 : setTeam1;
    const setOther = teamIndex === 0 ? setTeam1 : setTeam0;

    // Remove from other team if there
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
    const newData = addSession(data, {
      date,
      teams: [team0, team1],
      chritz,
    });
    update(newData);
    navigate('/abende');
  }

  const teamsComplete = team0.length === 2 && team1.length === 2;
  const playerName = (id: string) => players.find((p) => p.id === id)?.name ?? '?';

  const steps: Step[] = ['datum', 'teams', 'chritz', 'bestaetigen'];
  const stepLabels: Record<Step, string> = {
    datum: 'Datum',
    teams: 'Teams',
    chritz: 'Chritz',
    bestaetigen: 'Speichern',
  };
  const currentStepIdx = steps.indexOf(step);

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      <h2 className="text-2xl font-bold text-gray-800">Neuer Abend</h2>

      {/* Step indicator */}
      <div className="flex items-center gap-0">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center flex-1">
            <button
              onClick={() => i < currentStepIdx && setStep(s)}
              disabled={i > currentStepIdx}
              className={`w-8 h-8 rounded-full text-sm font-bold flex items-center justify-center transition-colors ${
                i < currentStepIdx
                  ? 'bg-green-600 text-white cursor-pointer'
                  : i === currentStepIdx
                  ? 'bg-green-700 text-white ring-4 ring-green-200'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              {i < currentStepIdx ? '✓' : i + 1}
            </button>
            {i < steps.length - 1 && (
              <div className={`flex-1 h-1 ${i < currentStepIdx ? 'bg-green-600' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
      </div>
      <p className="text-sm text-gray-500 font-medium">{stepLabels[step]}</p>

      {/* Step: Datum */}
      {step === 'datum' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Datum des Spielabends</span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-2 block w-full border border-gray-300 rounded-lg px-4 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </label>
          <button
            onClick={() => setStep('teams')}
            disabled={!date}
            className="w-full bg-green-700 text-white rounded-lg py-2.5 font-semibold hover:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Weiter →
          </button>
        </div>
      )}

      {/* Step: Teams */}
      {step === 'teams' && (
        <div className="space-y-4">
          {players.length < 4 ? (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-amber-800 text-sm">
              Mindestens 4 Spieler werden benötigt. Gehe zu «Spieler» um Spieler hinzuzufügen.
            </div>
          ) : (
            <>
              {[0, 1].map((ti) => {
                const team = ti === 0 ? team0 : team1;
                return (
                  <div key={ti} className="bg-white rounded-xl border border-gray-200 p-4">
                    <h3 className="font-semibold text-gray-700 mb-3">
                      Team {ti + 1}
                      <span className="ml-2 text-xs text-gray-400">({team.length}/2)</span>
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {players.map((p) => {
                        const inThisTeam = team.includes(p.id);
                        const inOtherTeam = (ti === 0 ? team1 : team0).includes(p.id);
                        const full = team.length >= 2 && !inThisTeam;
                        return (
                          <button
                            key={p.id}
                            onClick={() => togglePlayer(p.id, ti as 0 | 1)}
                            disabled={full || inOtherTeam}
                            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                              inThisTeam
                                ? 'bg-green-600 text-white'
                                : inOtherTeam
                                ? 'bg-blue-100 text-blue-400 cursor-not-allowed'
                                : full
                                ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                                : 'bg-gray-100 text-gray-700 hover:bg-green-100'
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
              <div className="flex gap-3">
                <button
                  onClick={() => setStep('datum')}
                  className="flex-1 border border-gray-300 text-gray-700 rounded-lg py-2.5 font-semibold hover:bg-gray-50 transition-colors"
                >
                  ← Zurück
                </button>
                <button
                  onClick={() => setStep('chritz')}
                  disabled={!teamsComplete}
                  className="flex-1 bg-green-700 text-white rounded-lg py-2.5 font-semibold hover:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Weiter →
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Step: Chritz */}
      {step === 'chritz' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {[0, 1].map((ti) => {
              const team = ti === 0 ? team0 : team1;
              return (
                <div key={ti} className="bg-white rounded-xl border border-gray-200 p-4">
                  <h3 className="font-semibold text-gray-700 text-sm mb-1">Team {ti + 1}</h3>
                  <p className="text-xs text-gray-500 mb-3">{team.map(playerName).join(' & ')}</p>
                  <div className="space-y-2">
                    {(['match', 'bergpreis', 'sieg'] as ChritzType[]).map((type) => (
                      <button
                        key={type}
                        onClick={() => addChritz(type, ti as 0 | 1)}
                        className="w-full flex items-center gap-2 px-3 py-2 bg-gray-50 hover:bg-green-50 border border-gray-200 hover:border-green-400 rounded-lg text-sm transition-colors"
                      >
                        <span>{CHRITZ_ICONS[type]}</span>
                        <span>{CHRITZ_LABELS[type]}</span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Chritz list */}
          {chritz.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-500 mb-3">
                Eingetragene Chritz ({chritz.length})
              </h3>
              <div className="space-y-2">
                {chritz.map((c) => (
                  <div key={c.id} className="flex items-center justify-between py-1.5 px-2 bg-gray-50 rounded-lg">
                    <span className="text-sm">
                      {CHRITZ_ICONS[c.type]} {CHRITZ_LABELS[c.type]}
                      <span className="ml-2 text-gray-500">
                        → Team {c.teamIndex + 1} ({(c.teamIndex === 0 ? team0 : team1).map(playerName).join(' & ')})
                      </span>
                    </span>
                    <button
                      onClick={() => removeChritz(c.id)}
                      className="text-red-400 hover:text-red-600 text-lg leading-none ml-2"
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
              className="flex-1 border border-gray-300 text-gray-700 rounded-lg py-2.5 font-semibold hover:bg-gray-50 transition-colors"
            >
              ← Zurück
            </button>
            <button
              onClick={() => setStep('bestaetigen')}
              className="flex-1 bg-green-700 text-white rounded-lg py-2.5 font-semibold hover:bg-green-800 transition-colors"
            >
              Weiter →
            </button>
          </div>
        </div>
      )}

      {/* Step: Bestätigen */}
      {step === 'bestaetigen' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <div>
              <span className="text-xs font-semibold text-gray-500 uppercase">Datum</span>
              <p className="font-semibold text-gray-800 mt-0.5">
                {new Date(date + 'T12:00:00').toLocaleDateString('de-CH', {
                  weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
                })}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[0, 1].map((ti) => (
                <div key={ti}>
                  <span className="text-xs font-semibold text-gray-500 uppercase">Team {ti + 1}</span>
                  <p className="font-semibold text-gray-800 mt-0.5">
                    {(ti === 0 ? team0 : team1).map(playerName).join(' & ')}
                  </p>
                </div>
              ))}
            </div>
            <div>
              <span className="text-xs font-semibold text-gray-500 uppercase">Chritz ({chritz.length})</span>
              {chritz.length === 0 ? (
                <p className="text-gray-400 text-sm mt-0.5">Keine Chritz eingetragen</p>
              ) : (
                <div className="mt-1 space-y-1">
                  {chritz.map((c) => (
                    <p key={c.id} className="text-sm text-gray-700">
                      {CHRITZ_ICONS[c.type]} {CHRITZ_LABELS[c.type]} → Team {c.teamIndex + 1}
                    </p>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep('chritz')}
              className="flex-1 border border-gray-300 text-gray-700 rounded-lg py-2.5 font-semibold hover:bg-gray-50 transition-colors"
            >
              ← Zurück
            </button>
            <button
              onClick={handleSave}
              className="flex-1 bg-green-700 text-white rounded-lg py-2.5 font-semibold hover:bg-green-800 transition-colors"
            >
              💾 Speichern
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState } from 'react';
import { useApp } from '../AppContext';
import { deleteSession, updateSession } from '../store';
import { CHRITZ_LABELS, CHRITZ_ICONS } from '../types';
import type { ChritzEntry, ChritzType } from '../types';

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

export default function Sessions() {
  const { data, update } = useApp();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [editingChritzSessionId, setEditingChritzSessionId] = useState<string | null>(null);

  const playerName = (id: string) => data.players.find((p) => p.id === id)?.name ?? '?';

  const sorted = [...data.sessions].sort((a, b) => b.date.localeCompare(a.date));

  function handleDelete(id: string) {
    update(deleteSession(data, id));
    setDeleteConfirmId(null);
    setExpandedId(null);
  }

  function handleAddChritz(sessionId: string, type: ChritzType, teamIndex: 0 | 1) {
    const session = data.sessions.find((s) => s.id === sessionId);
    if (!session) return;
    const newChritz: ChritzEntry = { id: generateId(), type, teamIndex };
    update(updateSession(data, { ...session, chritz: [...session.chritz, newChritz] }));
  }

  function handleRemoveChritz(sessionId: string, chritzId: string) {
    const session = data.sessions.find((s) => s.id === sessionId);
    if (!session) return;
    update(updateSession(data, { ...session, chritz: session.chritz.filter((c) => c.id !== chritzId) }));
  }

  if (sorted.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <div className="text-5xl mb-4">📅</div>
        <p className="font-semibold">Noch keine Abende erfasst.</p>
        <p className="text-sm mt-1">Tippe auf «Neu» um zu beginnen.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold tracking-tight text-gray-900">
        Abende <span className="text-gray-400 font-normal text-lg">({sorted.length})</span>
      </h2>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {sorted.map((session, idx) => {
          const isExpanded = expandedId === session.id;
          const isEditingChritz = editingChritzSessionId === session.id;
          const chritzTeam0 = session.chritz.filter((c) => c.teamIndex === 0);
          const chritzTeam1 = session.chritz.filter((c) => c.teamIndex === 1);
          const totalPts = session.chritz.reduce((sum, c) => sum + (c.type === 'sieg' ? 2 : 1), 0);

          return (
            <div key={session.id} className={idx < sorted.length - 1 ? 'border-b border-gray-100' : ''}>
              {/* Session header */}
              <button
                onClick={() => setExpandedId(isExpanded ? null : session.id)}
                className="w-full flex items-center gap-3 px-4 py-3.5 active:bg-gray-50 transition-colors text-left"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900">
                    {new Date(session.date + 'T12:00:00').toLocaleDateString('de-CH', {
                      weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
                    })}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5 truncate">
                    {session.teams[0].map(playerName).join(' & ')} vs {session.teams[1].map(playerName).join(' & ')}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-sm font-semibold text-green-700 bg-green-50 px-2.5 py-1 rounded-full">
                    {totalPts} Chritz
                  </span>
                  <span className={`text-gray-300 text-xs transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>▼</span>
                </div>
              </button>

              {/* Expanded detail */}
              {isExpanded && (
                <div className="border-t border-gray-100 px-4 pb-4 pt-3 space-y-3 bg-gray-50/50">
                  <div className="grid grid-cols-2 gap-2">
                    {[0, 1].map((ti) => {
                      const team = session.teams[ti as 0 | 1];
                      const teamChritz = ti === 0 ? chritzTeam0 : chritzTeam1;
                      return (
                        <div key={ti} className="bg-white rounded-xl p-3">
                          <div className="flex items-start justify-between mb-1">
                            <p className="text-xs font-semibold text-gray-400">TEAM {ti + 1}</p>
                            {teamChritz.length > 0 && (
                              <span className="bg-green-100 text-green-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-4">
                                {teamChritz.reduce((s, c) => s + (c.type === 'sieg' ? 2 : 1), 0)} Chritz
                              </span>
                            )}
                          </div>
                          <p className="font-semibold text-gray-800 text-sm">{team.map(playerName).join(' & ')}</p>
                          {teamChritz.length > 0 ? (
                            <div className="mt-2 space-y-1">
                              {isEditingChritz ? (
                                teamChritz.map((c) => (
                                  <div key={c.id} className="flex items-center justify-between text-xs text-gray-600">
                                    <span>{CHRITZ_ICONS[c.type]} {CHRITZ_LABELS[c.type]}</span>
                                    <button
                                      onClick={() => handleRemoveChritz(session.id, c.id)}
                                      className="text-red-400 active:text-red-600 ml-2 font-bold text-base leading-none"
                                    >×</button>
                                  </div>
                                ))
                              ) : (
                                (['match', 'bergpreis', 'sieg'] as ChritzType[]).map((type) => {
                                  const count = teamChritz.filter((c) => c.type === type).length;
                                  if (count === 0) return null;
                                  return (
                                    <div key={type} className="flex items-center justify-between text-xs text-gray-600">
                                      <span>{CHRITZ_ICONS[type]} {CHRITZ_LABELS[type]}</span>
                                      <span className="font-bold text-gray-800">×{count}</span>
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          ) : (
                            <p className="text-xs text-gray-300 mt-1">Keine Chritz</p>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Add Chritz (edit mode) */}
                  {isEditingChritz && (
                    <div className="bg-white rounded-xl p-3 space-y-2">
                      <p className="text-xs font-semibold text-gray-500 tracking-wide mb-2">CHRITZ HINZUFÜGEN</p>
                      <div className="grid grid-cols-2 gap-2">
                        {[0, 1].map((ti) => (
                          <div key={ti} className="space-y-1.5">
                            <p className="text-xs text-gray-400 font-medium">Team {ti + 1}</p>
                            {(['match', 'bergpreis', 'sieg'] as ChritzType[]).map((type) => (
                              <button
                                key={type}
                                onClick={() => handleAddChritz(session.id, type, ti as 0 | 1)}
                                className="w-full flex items-center gap-1.5 px-3 py-2 bg-gray-100 active:bg-gray-200 rounded-xl text-xs font-medium transition-colors"
                              >
                                {CHRITZ_ICONS[type]} {CHRITZ_LABELS[type]}
                              </button>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingChritzSessionId(isEditingChritz ? null : session.id)}
                      className={`flex-1 text-sm py-2.5 rounded-xl font-semibold transition-colors ${
                        isEditingChritz
                          ? 'bg-green-700 text-white active:bg-green-800'
                          : 'bg-gray-100 text-gray-700 active:bg-gray-200'
                      }`}
                    >
                      {isEditingChritz ? '✓ Fertig' : '✏️ Bearbeiten'}
                    </button>

                    {deleteConfirmId === session.id ? (
                      <>
                        <button
                          onClick={() => handleDelete(session.id)}
                          className="flex-1 text-sm py-2.5 rounded-xl bg-red-500 text-white font-semibold active:bg-red-600"
                        >
                          Löschen
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          className="flex-1 text-sm py-2.5 rounded-xl bg-gray-100 text-gray-600 font-semibold active:bg-gray-200"
                        >
                          Abbrechen
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirmId(session.id)}
                        className="text-sm px-4 py-2.5 rounded-xl bg-red-50 text-red-400 font-semibold active:bg-red-100"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

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
        <p className="font-medium">Noch keine Abende erfasst.</p>
        <p className="text-sm mt-1">Tippe auf «Neuer Abend» um zu beginnen.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-800">Abende ({sorted.length})</h2>

      {sorted.map((session) => {
        const isExpanded = expandedId === session.id;
        const isEditingChritz = editingChritzSessionId === session.id;

        // Group chritz by team
        const chritzTeam0 = session.chritz.filter((c) => c.teamIndex === 0);
        const chritzTeam1 = session.chritz.filter((c) => c.teamIndex === 1);

        return (
          <div key={session.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {/* Session header */}
            <button
              onClick={() => setExpandedId(isExpanded ? null : session.id)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
            >
              <div className="text-left">
                <p className="font-semibold text-gray-800">
                  {new Date(session.date + 'T12:00:00').toLocaleDateString('de-CH', {
                    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
                  })}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {session.teams[0].map(playerName).join(' & ')} vs {session.teams[1].map(playerName).join(' & ')}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-green-700 bg-green-50 px-2.5 py-0.5 rounded-full">
                  {session.chritz.reduce((sum, c) => sum + (c.type === 'sieg' ? 2 : 1), 0)} Chritz
                </span>
                <span className={`text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>▼</span>
              </div>
            </button>

            {/* Expanded detail */}
            {isExpanded && (
              <div className="border-t border-gray-100 px-4 pb-4 pt-3 space-y-4">
                {/* Teams + Chritz overview */}
                <div className="grid grid-cols-2 gap-3">
                  {[0, 1].map((ti) => {
                    const team = session.teams[ti as 0 | 1];
                    const teamChritz = ti === 0 ? chritzTeam0 : chritzTeam1;
                    return (
                      <div key={ti} className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs font-semibold text-gray-500 mb-1">Team {ti + 1}</p>
                        <p className="font-medium text-gray-800 text-sm">{team.map(playerName).join(' & ')}</p>
                        {teamChritz.length > 0 && (
                          <div className="mt-2 space-y-0.5">
                            {teamChritz.map((c) => (
                              <div key={c.id} className="flex items-center justify-between text-xs text-gray-600">
                                <span>{CHRITZ_ICONS[c.type]} {CHRITZ_LABELS[c.type]}</span>
                                {isEditingChritz && (
                                  <button
                                    onClick={() => handleRemoveChritz(session.id, c.id)}
                                    className="text-red-400 hover:text-red-600 ml-2 font-bold"
                                  >
                                    ×
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                        {teamChritz.length === 0 && (
                          <p className="text-xs text-gray-400 mt-1">Keine Chritz</p>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Add Chritz (edit mode) */}
                {isEditingChritz && (
                  <div className="border border-green-200 rounded-lg p-3 bg-green-50 space-y-2">
                    <p className="text-xs font-semibold text-green-700 mb-2">Chritz hinzufügen</p>
                    <div className="grid grid-cols-2 gap-2">
                      {[0, 1].map((ti) => (
                        <div key={ti} className="space-y-1">
                          <p className="text-xs text-gray-500">Team {ti + 1}</p>
                          {(['match', 'bergpreis', 'sieg'] as ChritzType[]).map((type) => (
                            <button
                              key={type}
                              onClick={() => handleAddChritz(session.id, type, ti as 0 | 1)}
                              className="w-full flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-gray-200 hover:border-green-400 rounded-lg text-xs transition-colors"
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
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => setEditingChritzSessionId(isEditingChritz ? null : session.id)}
                    className={`text-sm px-3 py-1.5 rounded-lg border font-medium transition-colors ${
                      isEditingChritz
                        ? 'bg-green-700 text-white border-green-700'
                        : 'border-gray-300 text-gray-600 hover:border-green-400'
                    }`}
                  >
                    {isEditingChritz ? '✓ Fertig' : '✏️ Chritz bearbeiten'}
                  </button>

                  {deleteConfirmId === session.id ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDelete(session.id)}
                        className="text-sm px-3 py-1.5 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 transition-colors"
                      >
                        Wirklich löschen
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(null)}
                        className="text-sm px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
                      >
                        Abbrechen
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirmId(session.id)}
                      className="text-sm px-3 py-1.5 rounded-lg border border-red-200 text-red-500 hover:border-red-400 font-medium transition-colors"
                    >
                      🗑️ Löschen
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

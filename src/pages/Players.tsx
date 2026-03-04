import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../AppContext';
import { addPlayer, deletePlayer, updatePlayer } from '../store';

export default function Players() {
  const { data, update } = useApp();
  const navigate = useNavigate();
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  function handleAdd() {
    const name = newName.trim();
    if (!name) return;
    if (data.players.some((p) => p.name.toLowerCase() === name.toLowerCase())) {
      alert('Ein Spieler mit diesem Namen existiert bereits.');
      return;
    }
    update(addPlayer(data, name));
    setNewName('');
  }

  function handleUpdate(id: string) {
    const name = editName.trim();
    if (!name) return;
    update(updatePlayer(data, id, name));
    setEditingId(null);
  }

  function handleDelete(id: string) {
    update(deletePlayer(data, id));
    setDeleteConfirmId(null);
  }

  // Count sessions per player
  const sessionCount = (playerId: string) =>
    data.sessions.filter((s) => [...s.teams[0], ...s.teams[1]].includes(playerId)).length;

  const totalChritz = (playerId: string) =>
    data.sessions.reduce((sum, s) => {
      const teamIdx = s.teams[0].includes(playerId) ? 0 : s.teams[1].includes(playerId) ? 1 : null;
      if (teamIdx === null) return sum;
      return sum + s.chritz.filter((c) => c.teamIndex === teamIdx).length;
    }, 0);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Spieler</h2>

      {/* Add player */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-500 mb-3">Neuer Spieler</h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder="Name eingeben..."
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <button
            onClick={handleAdd}
            disabled={!newName.trim()}
            className="bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Hinzufügen
          </button>
        </div>
      </div>

      {/* Player list */}
      {data.players.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <div className="text-5xl mb-4">👤</div>
          <p>Noch keine Spieler angelegt.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {data.players.map((player) => {
            const isEditing = editingId === player.id;
            const sessions = sessionCount(player.id);
            const chritz = totalChritz(player.id);

            return (
              <div key={player.id} className="bg-white rounded-xl border border-gray-200 p-4">
                {isEditing ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleUpdate(player.id);
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      autoFocus
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <button
                      onClick={() => handleUpdate(player.id)}
                      className="bg-green-700 text-white px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-green-800 transition-colors"
                    >
                      ✓
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="border border-gray-300 text-gray-600 px-3 py-1.5 rounded-lg text-sm hover:bg-gray-50 transition-colors"
                    >
                      ✗
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <button
                        onClick={() => navigate(`/spieler/${player.id}`)}
                        className="font-semibold text-gray-800 hover:text-green-700 transition-colors"
                      >
                        {player.name}
                      </button>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {sessions} Abende · {chritz} Chritz
                      </p>
                    </div>
                    <div className="flex gap-2 items-center">
                      {deleteConfirmId === player.id ? (
                        <>
                          <button
                            onClick={() => handleDelete(player.id)}
                            className="text-xs px-3 py-1.5 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 transition-colors"
                          >
                            Löschen
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="text-xs px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
                          >
                            Abbrechen
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => navigate(`/spieler/${player.id}`)}
                            className="text-xs px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600 hover:border-green-400 transition-colors"
                          >
                            Profil →
                          </button>
                          <button
                            onClick={() => { setEditingId(player.id); setEditName(player.name); }}
                            className="text-xs px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600 hover:border-gray-400 transition-colors"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(player.id)}
                            className="text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-400 hover:border-red-400 transition-colors"
                          >
                            🗑️
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Export / Import section */}
      <ExportImport />
    </div>
  );
}

function ExportImport() {
  const { data, update } = useApp();
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState('');

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setImportError('');
    try {
      const { importData } = await import('../store');
      const imported = await importData(file);
      if (window.confirm(`Daten importieren? Dies überschreibt alle aktuellen Daten (${data.players.length} Spieler, ${data.sessions.length} Abende).`)) {
        update(imported);
      }
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Fehler beim Import');
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
      <h3 className="text-sm font-semibold text-gray-500">Daten Export / Import</h3>
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={async () => { const { exportData } = await import('../store'); exportData(data); }}
          className="text-sm px-4 py-2 bg-green-700 text-white rounded-lg font-medium hover:bg-green-800 transition-colors"
        >
          📤 Exportieren
        </button>
        <label className={`text-sm px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:border-green-400 transition-colors cursor-pointer ${importing ? 'opacity-50' : ''}`}>
          📥 Importieren
          <input
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
            disabled={importing}
          />
        </label>
      </div>
      {importError && <p className="text-sm text-red-500">{importError}</p>}
      <p className="text-xs text-gray-400">
        Daten werden lokal in deinem Browser gespeichert. Exportiere regelmässig als Backup.
      </p>
    </div>
  );
}

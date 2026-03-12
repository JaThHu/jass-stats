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

  const sessionCount = (playerId: string) =>
    data.sessions.filter((s) => [...s.teams[0], ...s.teams[1]].includes(playerId)).length;

  // Fixed: Sieg counts as 2 points
  const totalChritz = (playerId: string) =>
    data.sessions.reduce((sum, s) => {
      const teamIdx = s.teams[0].includes(playerId) ? 0 : s.teams[1].includes(playerId) ? 1 : null;
      if (teamIdx === null) return sum;
      return sum + s.chritz
        .filter((c) => c.teamIndex === teamIdx)
        .reduce((pts, c) => pts + (c.type === 'sieg' ? 2 : 1), 0);
    }, 0);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold tracking-tight text-gray-900">Spieler</h2>

      {/* Add player */}
      <div className="bg-white rounded-2xl shadow-sm p-4">
        <p className="text-xs font-semibold text-gray-500 tracking-wide mb-3">NEUER SPIELER</p>
        <div className="flex gap-2">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder="Name eingeben..."
            className="flex-1 bg-gray-100 rounded-xl px-4 py-3 text-base outline-none focus:bg-gray-200 transition-colors"
          />
          <button
            onClick={handleAdd}
            disabled={!newName.trim()}
            className="bg-green-700 text-white px-5 py-3 rounded-xl font-semibold disabled:opacity-40 transition-opacity active:bg-green-800"
          >
            +
          </button>
        </div>
      </div>

      {/* Player list */}
      {data.players.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-4">👤</div>
          <p className="font-medium">Noch keine Spieler angelegt.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {data.players.map((player, idx) => {
            const isEditing = editingId === player.id;
            const sessions = sessionCount(player.id);
            const chritz = totalChritz(player.id);

            return (
              <div
                key={player.id}
                className={`px-4 py-3.5 ${idx < data.players.length - 1 ? 'border-b border-gray-100' : ''}`}
              >
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
                      className="flex-1 bg-gray-100 rounded-xl px-4 py-2.5 text-base outline-none focus:bg-gray-200 transition-colors"
                    />
                    <button
                      onClick={() => handleUpdate(player.id)}
                      className="bg-green-700 text-white px-4 py-2.5 rounded-xl font-semibold active:bg-green-800"
                    >
                      ✓
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="bg-gray-100 text-gray-500 px-4 py-2.5 rounded-xl active:bg-gray-200"
                    >
                      ✗
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <button
                        onClick={() => navigate(`/spieler/${player.id}`)}
                        className="font-semibold text-gray-900 active:text-green-700 transition-colors truncate block"
                      >
                        {player.name}
                      </button>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {sessions} Abende · {chritz} Chritz
                      </p>
                    </div>
                    <div className="flex gap-2 items-center flex-shrink-0">
                      {deleteConfirmId === player.id ? (
                        <>
                          <button
                            onClick={() => handleDelete(player.id)}
                            className="text-xs px-3 py-2 rounded-xl bg-red-500 text-white font-semibold active:bg-red-600"
                          >
                            Löschen
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="text-xs px-3 py-2 rounded-xl bg-gray-100 text-gray-600 active:bg-gray-200"
                          >
                            Abbrechen
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => navigate(`/spieler/${player.id}`)}
                            className="text-xs px-3 py-2 rounded-xl bg-gray-100 text-gray-600 active:bg-gray-200 font-medium"
                          >
                            Profil →
                          </button>
                          <button
                            onClick={() => { setEditingId(player.id); setEditName(player.name); }}
                            className="text-xs px-3 py-2 rounded-xl bg-gray-100 text-gray-600 active:bg-gray-200"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(player.id)}
                            className="text-xs px-3 py-2 rounded-xl bg-red-50 text-red-400 active:bg-red-100"
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
    <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
      <p className="text-xs font-semibold text-gray-500 tracking-wide">DATEN</p>
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={async () => { const { exportData } = await import('../store'); exportData(data); }}
          className="text-sm px-4 py-2.5 bg-green-700 text-white rounded-xl font-semibold active:bg-green-800 transition-colors"
        >
          Exportieren
        </button>
        <label className={`text-sm px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-semibold active:bg-gray-200 transition-colors cursor-pointer ${importing ? 'opacity-50' : ''}`}>
          Importieren
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
        Daten werden lokal gespeichert. Exportiere regelmässig als Backup.
      </p>
    </div>
  );
}

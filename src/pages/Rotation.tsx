import { useState } from 'react';
import { useApp } from '../AppContext';
import { addPlayer } from '../store';

// With 4 players [P0, P1, P2, P3], there are 3 unique pairings
function getPairings(ids: string[]) {
  const [p0, p1, p2, p3] = ids;
  return [
    { team0: [p0, p1], team1: [p2, p3] },
    { team0: [p0, p2], team1: [p1, p3] },
    { team0: [p0, p3], team1: [p1, p2] },
  ];
}

// Match a session's teams to a pairing index
function findPairingIndex(
  sessionTeams: [string[], string[]],
  pairings: { team0: string[]; team1: string[] }[]
): number {
  for (let i = 0; i < pairings.length; i++) {
    const { team0, team1 } = pairings[i];
    const t0 = sessionTeams[0];
    const t1 = sessionTeams[1];
    const match =
      (team0.every((id) => t0.includes(id)) && team1.every((id) => t1.includes(id))) ||
      (team0.every((id) => t1.includes(id)) && team1.every((id) => t0.includes(id)));
    if (match) return i;
  }
  return -1;
}

export default function Rotation() {
  const { data, update } = useApp();
  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);

  // Sort players stably by creation date
  const players = [...data.players].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const playerMap = Object.fromEntries(players.map((p) => [p.id, p.name]));

  function handleAddPlayer(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    update(addPlayer(data, newName));
    setNewName('');
    setAdding(false);
  }

  if (players.length < 4) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-800">Rotation</h2>
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-4">🔄</div>
          <p className="font-medium">Mindestens 4 Spieler benötigt.</p>
          <p className="text-sm mt-1">Aktuell: {players.length} Spieler</p>
        </div>
        <PlayerAdder
          adding={adding}
          setAdding={setAdding}
          newName={newName}
          setNewName={setNewName}
          onSubmit={handleAddPlayer}
        />
      </div>
    );
  }

  const ids = players.slice(0, 4).map((p) => p.id);
  const pairings = getPairings(ids);

  // Find which pairing was last used
  const lastSession = data.sessions[0]; // newest first
  let currentIndex = -1;
  if (lastSession) {
    currentIndex = findPairingIndex(lastSession.teams, pairings);
  }
  const nextIndex = (currentIndex + 1) % 3;
  const nextPairing = pairings[nextIndex];

  // Show all 3 pairings for reference
  const pairingLabels = ['Paarung A', 'Paarung B', 'Paarung C'];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Rotation</h2>

      {/* Next session highlight */}
      <div className="bg-green-700 text-white rounded-2xl p-5 shadow-md">
        <p className="text-sm font-semibold uppercase tracking-wide text-green-200 mb-3">
          Nächster Abend — {pairingLabels[nextIndex]}
        </p>
        <div className="flex items-center gap-4">
          <div className="flex-1 bg-white/10 rounded-xl p-4 text-center">
            <p className="text-xs text-green-200 mb-2 font-medium">Team 1</p>
            {nextPairing.team0.map((id) => (
              <p key={id} className="text-lg font-bold">{playerMap[id]}</p>
            ))}
          </div>
          <div className="text-2xl font-bold text-green-300">VS</div>
          <div className="flex-1 bg-white/10 rounded-xl p-4 text-center">
            <p className="text-xs text-green-200 mb-2 font-medium">Team 2</p>
            {nextPairing.team1.map((id) => (
              <p key={id} className="text-lg font-bold">{playerMap[id]}</p>
            ))}
          </div>
        </div>
      </div>

      {/* All 3 pairings overview */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Alle Paarungen</h3>
        </div>
        <div className="divide-y divide-gray-50">
          {pairings.map((pairing, i) => {
            const isCurrent = i === currentIndex;
            const isNext = i === nextIndex;
            return (
              <div
                key={i}
                className={`px-4 py-3 flex items-center gap-3 ${isNext ? 'bg-green-50' : ''}`}
              >
                <span className="text-xs font-semibold text-gray-400 w-20">{pairingLabels[i]}</span>
                <span className="flex-1 text-sm text-gray-700">
                  {pairing.team0.map((id) => playerMap[id]).join(' & ')}
                  <span className="text-gray-400 mx-2">vs</span>
                  {pairing.team1.map((id) => playerMap[id]).join(' & ')}
                </span>
                <div className="flex gap-1">
                  {isCurrent && (
                    <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">Letzter Abend</span>
                  )}
                  {isNext && (
                    <span className="text-xs bg-green-600 text-white px-2 py-0.5 rounded-full">Nächster</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Spieler */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Spieler</h3>
          <button
            onClick={() => setAdding(true)}
            className="text-xs text-green-700 font-semibold hover:text-green-900"
          >
            + Hinzufügen
          </button>
        </div>
        <ul className="divide-y divide-gray-50">
          {players.map((p, i) => (
            <li key={p.id} className="px-4 py-2.5 flex items-center gap-3 text-sm text-gray-700">
              <span className="w-5 h-5 rounded-full bg-green-100 text-green-700 text-xs font-bold flex items-center justify-center">
                {i + 1}
              </span>
              {p.name}
            </li>
          ))}
        </ul>
        {adding && (
          <form onSubmit={handleAddPlayer} className="px-4 py-3 border-t border-gray-100 flex gap-2">
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Name eingeben…"
              className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <button
              type="submit"
              className="bg-green-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-green-800"
            >
              OK
            </button>
            <button
              type="button"
              onClick={() => { setAdding(false); setNewName(''); }}
              className="text-gray-400 hover:text-gray-600 text-sm px-2"
            >
              Abbrechen
            </button>
          </form>
        )}
      </div>

      {players.length > 4 && (
        <p className="text-xs text-gray-400 text-center">
          Rotation basiert auf den ersten 4 Spielern (nach Erstelldatum).
        </p>
      )}
    </div>
  );
}

function PlayerAdder({
  adding, setAdding, newName, setNewName, onSubmit,
}: {
  adding: boolean;
  setAdding: (v: boolean) => void;
  newName: string;
  setNewName: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      {adding ? (
        <form onSubmit={onSubmit} className="flex gap-2">
          <input
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Name eingeben…"
            className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <button type="submit" className="bg-green-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-green-800">
            OK
          </button>
          <button type="button" onClick={() => { setAdding(false); setNewName(''); }} className="text-gray-400 text-sm px-2">
            Abbrechen
          </button>
        </form>
      ) : (
        <button onClick={() => setAdding(true)} className="w-full text-green-700 font-semibold text-sm hover:text-green-900">
          + Spieler hinzufügen
        </button>
      )}
    </div>
  );
}

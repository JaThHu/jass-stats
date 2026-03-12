import { useState } from 'react';
import { useApp } from '../AppContext';
import { addPlayer } from '../store';

function getPairings(ids: string[]) {
  const [p0, p1, p2, p3] = ids;
  return [
    { team0: [p0, p1], team1: [p2, p3] },
    { team0: [p0, p2], team1: [p1, p3] },
    { team0: [p0, p3], team1: [p1, p2] },
  ];
}

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
      <div className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">Rotation</h2>
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-4">🔄</div>
          <p className="font-semibold">Mindestens 4 Spieler benötigt.</p>
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

  const lastSession = data.sessions[0];
  let currentIndex = -1;
  if (lastSession) {
    currentIndex = findPairingIndex(lastSession.teams, pairings);
  }
  const nextIndex = (currentIndex + 1) % 3;
  const nextPairing = pairings[nextIndex];
  const pairingLabels = ['A', 'B', 'C'];

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold tracking-tight text-gray-900">Rotation</h2>

      {/* Next session highlight */}
      <div className="bg-green-700 text-white rounded-2xl p-5 shadow-sm">
        <p className="text-xs font-semibold tracking-wide text-green-200 mb-4">
          NÄCHSTER ABEND — PAARUNG {pairingLabels[nextIndex]}
        </p>
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-white/10 rounded-xl p-4 text-center">
            <p className="text-xs text-green-200 mb-2 font-semibold tracking-wide">TEAM 1</p>
            {nextPairing.team0.map((id) => (
              <p key={id} className="text-lg font-bold leading-tight">{playerMap[id]}</p>
            ))}
          </div>
          <div className="text-xl font-bold text-green-300">VS</div>
          <div className="flex-1 bg-white/10 rounded-xl p-4 text-center">
            <p className="text-xs text-green-200 mb-2 font-semibold tracking-wide">TEAM 2</p>
            {nextPairing.team1.map((id) => (
              <p key={id} className="text-lg font-bold leading-tight">{playerMap[id]}</p>
            ))}
          </div>
        </div>
      </div>

      {/* All 3 pairings */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <p className="text-xs font-semibold text-gray-500 tracking-wide">ALLE PAARUNGEN</p>
        </div>
        {pairings.map((pairing, i) => {
          const isCurrent = i === currentIndex;
          const isNext = i === nextIndex;
          return (
            <div
              key={i}
              className={`px-4 py-3.5 flex items-center gap-3 ${i < 2 ? 'border-b border-gray-100' : ''} ${isNext ? 'bg-green-50' : ''}`}
            >
              <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                isNext ? 'bg-green-700 text-white' : 'bg-gray-100 text-gray-500'
              }`}>
                {pairingLabels[i]}
              </span>
              <span className="flex-1 text-sm text-gray-700">
                {pairing.team0.map((id) => playerMap[id]).join(' & ')}
                <span className="text-gray-300 mx-2">vs</span>
                {pairing.team1.map((id) => playerMap[id]).join(' & ')}
              </span>
              <div className="flex gap-1.5">
                {isCurrent && (
                  <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">Letzter</span>
                )}
                {isNext && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">Nächster</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Players */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <p className="text-xs font-semibold text-gray-500 tracking-wide">SPIELER</p>
          <button
            onClick={() => setAdding(true)}
            className="text-xs text-green-700 font-semibold active:text-green-900"
          >
            + Hinzufügen
          </button>
        </div>
        <ul>
          {players.map((p, i) => (
            <li
              key={p.id}
              className={`px-4 py-3 flex items-center gap-3 text-sm text-gray-800 ${i < players.length - 1 ? 'border-b border-gray-100' : ''}`}
            >
              <span className="w-6 h-6 rounded-full bg-green-100 text-green-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
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
              className="flex-1 bg-gray-100 rounded-xl px-4 py-2.5 text-sm outline-none focus:bg-gray-200 transition-colors"
            />
            <button
              type="submit"
              className="bg-green-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold active:bg-green-800"
            >
              OK
            </button>
            <button
              type="button"
              onClick={() => { setAdding(false); setNewName(''); }}
              className="bg-gray-100 text-gray-500 px-3 py-2.5 rounded-xl text-sm active:bg-gray-200"
            >
              Abb.
            </button>
          </form>
        )}
      </div>

      {players.length > 4 && (
        <p className="text-xs text-gray-400 text-center px-4">
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
    <div className="bg-white rounded-2xl shadow-sm p-4">
      {adding ? (
        <form onSubmit={onSubmit} className="flex gap-2">
          <input
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Name eingeben…"
            className="flex-1 bg-gray-100 rounded-xl px-4 py-2.5 text-sm outline-none focus:bg-gray-200 transition-colors"
          />
          <button type="submit" className="bg-green-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold active:bg-green-800">
            OK
          </button>
          <button type="button" onClick={() => { setAdding(false); setNewName(''); }} className="bg-gray-100 text-gray-500 px-3 py-2.5 rounded-xl text-sm active:bg-gray-200">
            Abb.
          </button>
        </form>
      ) : (
        <button onClick={() => setAdding(true)} className="w-full text-green-700 font-semibold text-sm active:text-green-900">
          + Spieler hinzufügen
        </button>
      )}
    </div>
  );
}

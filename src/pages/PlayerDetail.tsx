import { useParams, useNavigate } from 'react-router-dom';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { useApp } from '../AppContext';
import { computePlayerStats, getPlayerHistory } from '../store';
import { CHRITZ_LABELS, CHRITZ_ICONS } from '../types';
import type { ChritzType } from '../types';

export default function PlayerDetail() {
  const { id } = useParams<{ id: string }>();
  const { data } = useApp();
  const navigate = useNavigate();

  const player = data.players.find((p) => p.id === id);
  if (!player) {
    return (
      <div className="text-center py-16 text-gray-400">
        <p>Spieler nicht gefunden.</p>
        <button onClick={() => navigate('/spieler')} className="mt-4 text-green-600 text-sm">← Zurück</button>
      </div>
    );
  }

  const allStats = computePlayerStats(data);
  const myStats = allStats.find((s) => s.playerId === id);
  const rank = allStats.findIndex((s) => s.playerId === id) + 1;
  const history = getPlayerHistory(data, id!);

  const playerName = (pid: string) => data.players.find((p) => p.id === pid)?.name ?? '?';

  // Sessions this player was in
  const mySessions = data.sessions
    .filter((s) => [...s.teams[0], ...s.teams[1]].includes(id!))
    .sort((a, b) => b.date.localeCompare(a.date));

  const medals = ['🥇', '🥈', '🥉'];
  const rankLabel = rank <= 3 ? medals[rank - 1] : `#${rank}`;

  return (
    <div className="space-y-6">
      {/* Back */}
      <button onClick={() => navigate('/spieler')} className="text-sm text-gray-500 hover:text-green-700 transition-colors">
        ← Spieler
      </button>

      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center text-2xl font-bold text-green-700">
          {player.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">{player.name}</h2>
          <p className="text-gray-500 text-sm mt-0.5">Rang {rankLabel} · {myStats?.sessions ?? 0} Abende gespielt</p>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="bg-green-700 text-white rounded-xl p-4">
          <p className="text-green-200 text-xs font-semibold uppercase">Total Chritz</p>
          <p className="text-3xl font-bold mt-1">{myStats?.total ?? 0}</p>
        </div>
        {(['match', 'bergpreis', 'sieg'] as ChritzType[]).map((type) => (
          <div key={type} className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-gray-400 text-xs font-semibold uppercase flex items-center gap-1">
              {CHRITZ_ICONS[type]} {CHRITZ_LABELS[type]}
            </p>
            <p className="text-3xl font-bold mt-1 text-gray-800">{myStats?.[type] ?? 0}</p>
          </div>
        ))}
      </div>

      {/* Line chart: cumulative chritz over time */}
      {history.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Verlauf</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={history} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11 }}
                tickFormatter={(d) => new Date(d + 'T12:00:00').toLocaleDateString('de-CH', { day: 'numeric', month: 'short' })}
              />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip
                labelFormatter={(d) => new Date(d + 'T12:00:00').toLocaleDateString('de-CH', { weekday: 'short', day: 'numeric', month: 'short' })}
                formatter={(val, name) => [val, name === 'cumulative' ? 'Total Chritz' : 'Chritz diesen Abend']}
                contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb' }}
              />
              <Line
                type="monotone"
                dataKey="cumulative"
                stroke="#15803d"
                strokeWidth={2.5}
                dot={{ r: 4, fill: '#15803d' }}
                name="cumulative"
              />
              <Line
                type="monotone"
                dataKey="chritz"
                stroke="#86efac"
                strokeWidth={1.5}
                dot={false}
                strokeDasharray="4 4"
                name="chritz"
              />
            </LineChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-2 text-xs text-gray-400">
            <span className="flex items-center gap-1.5"><span className="w-4 h-0.5 bg-green-700 inline-block"></span>Kumulativ</span>
            <span className="flex items-center gap-1.5"><span className="w-4 h-0.5 bg-green-300 inline-block border-t border-dashed border-green-300"></span>Pro Abend</span>
          </div>
        </div>
      )}

      {/* Sessions list */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Alle Abende</h3>
        </div>
        {mySessions.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-8">Noch keine Abende gespielt.</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-4 py-2 text-xs font-semibold text-gray-400">Datum</th>
                <th className="text-left px-4 py-2 text-xs font-semibold text-gray-400">Partner</th>
                <th className="text-left px-4 py-2 text-xs font-semibold text-gray-400">Gegner</th>
                <th className="text-center px-4 py-2 text-xs font-semibold text-gray-400">Chritz</th>
              </tr>
            </thead>
            <tbody>
              {mySessions.map((session) => {
                const myTeamIdx = session.teams[0].includes(id!) ? 0 : 1;
                const myTeam = session.teams[myTeamIdx];
                const otherTeam = session.teams[myTeamIdx === 0 ? 1 : 0];
                const partnerIds = myTeam.filter((pid) => pid !== id);
                const myChritz = session.chritz.filter((c) => c.teamIndex === myTeamIdx).reduce((sum, c) => sum + (c.type === 'sieg' ? 2 : 1), 0);

                return (
                  <tr key={session.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {new Date(session.date + 'T12:00:00').toLocaleDateString('de-CH', {
                        day: 'numeric', month: 'short', year: '2-digit',
                      })}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {partnerIds.map(playerName).join(', ') || '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {otherTeam.map(playerName).join(' & ')}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${
                        myChritz > 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-400'
                      }`}>
                        {myChritz}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

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
        <button onClick={() => navigate('/spieler')} className="mt-4 text-green-700 text-sm font-semibold">← Zurück</button>
      </div>
    );
  }

  const allStats = computePlayerStats(data);
  const myStats = allStats.find((s) => s.playerId === id);
  const rank = allStats.findIndex((s) => s.playerId === id) + 1;
  const history = getPlayerHistory(data, id!);

  const playerName = (pid: string) => data.players.find((p) => p.id === pid)?.name ?? '?';

  const mySessions = data.sessions
    .filter((s) => [...s.teams[0], ...s.teams[1]].includes(id!))
    .sort((a, b) => b.date.localeCompare(a.date));

  const medals = ['🥇', '🥈', '🥉'];
  const rankLabel = rank <= 3 ? medals[rank - 1] : `#${rank}`;

  return (
    <div className="space-y-4">
      {/* Back */}
      <button
        onClick={() => navigate('/spieler')}
        className="text-sm text-gray-400 font-medium active:text-green-700 transition-colors"
      >
        ← Spieler
      </button>

      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm p-5 flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center text-2xl font-bold text-green-700 flex-shrink-0">
          {player.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">{player.name}</h2>
          <p className="text-gray-400 text-sm mt-0.5">Rang {rankLabel} · {myStats?.sessions ?? 0} Abende</p>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-green-700 text-white rounded-2xl p-4 col-span-1">
          <p className="text-green-200 text-xs font-semibold tracking-wide">TOTAL CHRITZ</p>
          <p className="text-4xl font-bold mt-1">{myStats?.total ?? 0}</p>
        </div>
        <div className="grid grid-cols-1 gap-3 col-span-1">
          {(['match', 'bergpreis', 'sieg'] as ChritzType[]).map((type) => (
            <div key={type} className="bg-white rounded-2xl shadow-sm p-3 flex items-center justify-between">
              <span className="text-sm text-gray-500 flex items-center gap-1.5">
                <span>{CHRITZ_ICONS[type]}</span>
                <span className="font-medium">{CHRITZ_LABELS[type]}</span>
              </span>
              <span className="text-xl font-bold text-gray-900">{myStats?.[type] ?? 0}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Line chart */}
      {history.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <p className="text-xs font-semibold text-gray-500 tracking-wide mb-4">VERLAUF</p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={history} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fontFamily: 'inherit' }}
                tickFormatter={(d) => new Date(d + 'T12:00:00').toLocaleDateString('de-CH', { day: 'numeric', month: 'short' })}
              />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fontFamily: 'inherit' }} />
              <Tooltip
                labelFormatter={(d) => new Date(d + 'T12:00:00').toLocaleDateString('de-CH', { weekday: 'short', day: 'numeric', month: 'short' })}
                formatter={(val, name) => [val, name === 'cumulative' ? 'Total Chritz' : 'Chritz diesen Abend']}
                contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.12)', fontFamily: 'inherit' }}
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
            <span className="flex items-center gap-1.5">
              <span className="w-4 h-0.5 bg-green-700 inline-block rounded"></span>Kumulativ
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-4 h-0.5 bg-green-300 inline-block rounded border-t border-dashed border-green-300"></span>Pro Abend
            </span>
          </div>
        </div>
      )}

      {/* Sessions list */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <p className="text-xs font-semibold text-gray-500 tracking-wide">ALLE ABENDE</p>
        </div>
        {mySessions.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-8">Noch keine Abende gespielt.</p>
        ) : (
          <div>
            {mySessions.map((session, idx) => {
              const myTeamIdx = session.teams[0].includes(id!) ? 0 : 1;
              const myTeam = session.teams[myTeamIdx];
              const otherTeam = session.teams[myTeamIdx === 0 ? 1 : 0];
              const partnerIds = myTeam.filter((pid) => pid !== id);
              const myChritz = session.chritz
                .filter((c) => c.teamIndex === myTeamIdx)
                .reduce((sum, c) => sum + (c.type === 'sieg' ? 2 : 1), 0);

              return (
                <div
                  key={session.id}
                  className={`px-4 py-3.5 flex items-center gap-3 ${idx < mySessions.length - 1 ? 'border-b border-gray-100' : ''}`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">
                      {new Date(session.date + 'T12:00:00').toLocaleDateString('de-CH', {
                        day: 'numeric', month: 'short', year: '2-digit',
                      })}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5 truncate">
                      mit {partnerIds.map(playerName).join(', ') || '—'}
                      <span className="text-gray-300 mx-1.5">vs</span>
                      {otherTeam.map(playerName).join(' & ')}
                    </p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold flex-shrink-0 ${
                    myChritz > 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-400'
                  }`}>
                    {myChritz} Chritz
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

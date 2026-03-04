import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useApp } from '../AppContext';
import { computePlayerStats } from '../store';
import { CHRITZ_LABELS, CHRITZ_ICONS } from '../types';

const TEAM_COLORS = ['#15803d', '#1d4ed8', '#b45309', '#be123c'];

export default function Dashboard() {
  const { data } = useApp();
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');

  const stats = computePlayerStats(data, filterFrom || undefined, filterTo || undefined);
  const playerMap = Object.fromEntries(data.players.map((p) => [p.id, p.name]));

  const chartData = stats.map((s, i) => ({
    name: playerMap[s.playerId] ?? '?',
    Chritz: s.total,
    color: TEAM_COLORS[i % TEAM_COLORS.length],
  }));

  const totalSessions = data.sessions.filter((s) => {
    if (filterFrom && s.date < filterFrom) return false;
    if (filterTo && s.date > filterTo) return false;
    return true;
  }).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Rangliste</h2>
        <span className="text-sm text-gray-500">{totalSessions} Abende</span>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Von</label>
          <input
            type="date"
            value={filterFrom}
            onChange={(e) => setFilterFrom(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Bis</label>
          <input
            type="date"
            value={filterTo}
            onChange={(e) => setFilterTo(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        {(filterFrom || filterTo) && (
          <button
            onClick={() => { setFilterFrom(''); setFilterTo(''); }}
            className="text-sm text-gray-500 hover:text-red-500 transition-colors"
          >
            Filter zurücksetzen
          </button>
        )}
      </div>

      {data.players.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-4">👥</div>
          <p className="font-medium">Noch keine Spieler angelegt.</p>
          <p className="text-sm mt-1">Gehe zu «Spieler» um Spieler hinzuzufügen.</p>
        </div>
      ) : (
        <>
          {/* Bar Chart */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Gesamt-Chritz</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <XAxis dataKey="name" tick={{ fontSize: 13 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(val) => [`${val} Chritz`, '']}
                  contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb' }}
                />
                <Bar dataKey="Chritz" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Rangliste Tabelle */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">#</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Spieler</th>
                  <th className="text-center px-2 py-3 text-xs font-semibold text-gray-500 uppercase">{CHRITZ_ICONS.match}</th>
                  <th className="text-center px-2 py-3 text-xs font-semibold text-gray-500 uppercase">{CHRITZ_ICONS.bergpreis}</th>
                  <th className="text-center px-2 py-3 text-xs font-semibold text-gray-500 uppercase">{CHRITZ_ICONS.sieg}</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Total</th>
                </tr>
              </thead>
              <tbody>
                {stats.map((s, i) => (
                  <tr key={s.playerId} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-bold text-gray-400">
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-800">
                      {playerMap[s.playerId] ?? '?'}
                      <span className="ml-2 text-xs text-gray-400 font-normal">{s.sessions} Abende</span>
                    </td>
                    <td className="px-2 py-3 text-center text-gray-700">{s.match || '—'}</td>
                    <td className="px-2 py-3 text-center text-gray-700">{s.bergpreis || '—'}</td>
                    <td className="px-2 py-3 text-center text-gray-700">{s.sieg || '—'}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-block bg-green-100 text-green-800 font-bold text-sm px-3 py-0.5 rounded-full">
                        {s.total}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {stats.length === 0 && (
              <div className="text-center py-8 text-gray-400 text-sm">Keine Daten im gewählten Zeitraum</div>
            )}
          </div>

          {/* Legende */}
          <div className="flex gap-4 flex-wrap text-sm text-gray-500">
            {Object.entries(CHRITZ_LABELS).map(([type, label]) => (
              <span key={type} className="flex items-center gap-1">
                {CHRITZ_ICONS[type as keyof typeof CHRITZ_ICONS]} {label}
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

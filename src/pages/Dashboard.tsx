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
  const [showFilter, setShowFilter] = useState(false);

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

  const isFiltered = filterFrom || filterTo;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">Rangliste</h2>
          <p className="text-sm text-gray-400 mt-0.5">{totalSessions} Abende</p>
        </div>
        <button
          onClick={() => setShowFilter(!showFilter)}
          className={`text-sm px-3.5 py-2 rounded-xl font-semibold transition-colors ${
            isFiltered
              ? 'bg-green-700 text-white'
              : 'bg-gray-100 text-gray-600 active:bg-gray-200'
          }`}
        >
          Filter{isFiltered ? ' ✓' : ''}
        </button>
      </div>

      {/* Filter */}
      {showFilter && (
        <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-gray-500 tracking-wide mb-2">VON</label>
              <input
                type="date"
                value={filterFrom}
                onChange={(e) => setFilterFrom(e.target.value)}
                className="w-full bg-gray-100 rounded-xl px-4 py-3 text-sm outline-none focus:bg-gray-200 transition-colors"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-semibold text-gray-500 tracking-wide mb-2">BIS</label>
              <input
                type="date"
                value={filterTo}
                onChange={(e) => setFilterTo(e.target.value)}
                className="w-full bg-gray-100 rounded-xl px-4 py-3 text-sm outline-none focus:bg-gray-200 transition-colors"
              />
            </div>
          </div>
          {isFiltered && (
            <button
              onClick={() => { setFilterFrom(''); setFilterTo(''); }}
              className="text-sm text-red-500 font-medium active:text-red-700"
            >
              Filter zurücksetzen
            </button>
          )}
        </div>
      )}

      {data.players.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-4">👥</div>
          <p className="font-semibold">Noch keine Spieler angelegt.</p>
          <p className="text-sm mt-1">Gehe zu «Spieler» um Spieler hinzuzufügen.</p>
        </div>
      ) : (
        <>
          {/* Bar Chart */}
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <p className="text-xs font-semibold text-gray-500 tracking-wide mb-4">GESAMT-CHRITZ</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <XAxis dataKey="name" tick={{ fontSize: 13, fontFamily: 'inherit' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fontFamily: 'inherit' }} />
                <Tooltip
                  formatter={(val) => [`${val} Chritz`, '']}
                  contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.12)', fontFamily: 'inherit' }}
                />
                <Bar dataKey="Chritz" radius={[8, 8, 0, 0]}>
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Rangliste */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="text-xs font-semibold text-gray-500 tracking-wide">SPIELER</p>
            </div>
            {stats.length === 0 ? (
              <p className="text-center py-8 text-gray-400 text-sm">Keine Daten im gewählten Zeitraum</p>
            ) : (
              <div>
                {stats.map((s, i) => (
                  <div
                    key={s.playerId}
                    className={`flex items-center gap-3 px-4 py-3.5 ${i < stats.length - 1 ? 'border-b border-gray-100' : ''}`}
                  >
                    <span className="text-xl w-8 text-center flex-shrink-0">
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : <span className="text-sm font-bold text-gray-400">{i + 1}</span>}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{playerMap[s.playerId] ?? '?'}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {s.sessions} Abende
                        <span className="mx-1.5">·</span>
                        {CHRITZ_ICONS.match} {s.match}
                        <span className="mx-1.5">·</span>
                        {CHRITZ_ICONS.bergpreis} {s.bergpreis}
                        <span className="mx-1.5">·</span>
                        {CHRITZ_ICONS.sieg} {s.sieg}
                      </p>
                    </div>
                    <span className="bg-green-100 text-green-800 font-bold text-sm px-3 py-1 rounded-full flex-shrink-0">
                      {s.total}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Legende */}
          <div className="flex gap-4 flex-wrap text-sm text-gray-400 px-1">
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

import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { TEAM_COLORS } from '../lib/colors';
import { formatDate } from '../lib/format';

const AXIS = { fontSize: 11, fill: '#6f7c77', fontFamily: 'inherit' };
const GRID = '#202925';
const tooltipStyle = {
  contentStyle: {
    background: '#1c2421',
    border: '1px solid #2c3733',
    borderRadius: 12,
    boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
    fontFamily: 'inherit',
    fontSize: 13,
    padding: '8px 12px',
  },
  labelStyle: { color: '#a6b3ae', marginBottom: 4 },
  itemStyle: { color: '#edf2f0', padding: 0 },
  cursor: { stroke: '#3a4642', strokeWidth: 1 },
};

export function Legend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-ink-2">
      {items.map((i) => (
        <span key={i.label} className="inline-flex items-center gap-1.5 min-w-0">
          <span className="w-3 h-[3px] rounded-full flex-shrink-0" style={{ background: i.color }} />
          <span className="truncate">{i.label}</span>
        </span>
      ))}
    </div>
  );
}

/** Punkteverlauf einer Partie: kumulierte Punkte beider Teams pro Runde. */
export function GameChart({ series, names }: { series: { n: number; a: number; b: number }[]; names: [string, string] }) {
  const max = Math.max(2500, ...series.map((s) => Math.max(s.a, s.b)));
  return (
    <div className="space-y-2">
      <Legend items={[{ label: names[0], color: TEAM_COLORS[0] }, { label: names[1], color: TEAM_COLORS[1] }]} />
      <div className="h-48 -ml-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={series} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid stroke={GRID} vertical={false} />
            <XAxis dataKey="n" tick={AXIS} tickLine={false} axisLine={{ stroke: GRID }} allowDecimals={false} />
            <YAxis
              tick={AXIS}
              tickLine={false}
              axisLine={false}
              width={40}
              domain={[0, Math.ceil(max / 500) * 500]}
              ticks={[0, 500, 1000, 1500, 2000, 2500].filter((t) => t <= max)}
            />
            <ReferenceLine y={1500} stroke="#4a5853" strokeDasharray="4 4" />
            <ReferenceLine y={2500} stroke="#4a5853" strokeDasharray="4 4" />
            <Tooltip
              {...tooltipStyle}
              labelFormatter={(n) => (Number(n) === 0 ? 'Start' : `Runde ${n}`)}
              formatter={(v, key) => [v as number, key === 'a' ? names[0] : names[1]]}
            />
            <Line type="linear" dataKey="a" stroke={TEAM_COLORS[0]} strokeWidth={2} dot={false} activeDot={{ r: 4, stroke: '#141a18', strokeWidth: 2 }} isAnimationActive={false} />
            <Line type="linear" dataKey="b" stroke={TEAM_COLORS[1]} strokeWidth={2} dot={false} activeDot={{ r: 4, stroke: '#141a18', strokeWidth: 2 }} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/** Kumulierte Chritz pro Spieler über alle Abende. */
export function TimelineChart({
  points,
  players,
  hideLegend,
}: {
  points: Record<string, string | number>[];
  players: { id: string; name: string; color: string }[];
  hideLegend?: boolean;
}) {
  return (
    <div className="space-y-2">
      {!hideLegend && <Legend items={players.map((p) => ({ label: p.name, color: p.color }))} />}
      <div className="h-56 -ml-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={points} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid stroke={GRID} vertical={false} />
            <XAxis
              dataKey="date"
              tick={AXIS}
              tickLine={false}
              axisLine={{ stroke: GRID }}
              tickFormatter={(d) => formatDate(String(d), 'tiny')}
              minTickGap={24}
            />
            <YAxis tick={AXIS} tickLine={false} axisLine={false} width={36} allowDecimals={false} />
            <Tooltip
              {...tooltipStyle}
              labelFormatter={(d) => formatDate(String(d))}
              formatter={(v, key) => [v as number, players.find((p) => p.id === key)?.name ?? '']}
              itemSorter={(item) => -(Number(item.value) || 0)}
            />
            {players.map((p) => (
              <Line
                key={p.id}
                type="monotone"
                dataKey={p.id}
                stroke={p.color}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, stroke: '#141a18', strokeWidth: 2 }}
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

import { Link, useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, UserX } from 'lucide-react';
import { useApp } from '../data/store';
import { playerColor } from '../lib/colors';
import { formatDate, nameOf, pct, teamName } from '../lib/format';
import { sortEveningsDesc } from '../lib/rotation';
import { chritzPoints, chritzTimeline, duoStats, playerStats, streaks, teamOf } from '../lib/stats';
import { CHRITZ_ICONS, CHRITZ_LABELS, CHRITZ_TYPES } from '../lib/types';
import { TimelineChart } from '../components/charts';
import { Avatar, Button, Card, Empty, Label, StatTile } from '../components/ui';
import { cx } from '../lib/cx';

export default function PlayerDetail() {
  const { id } = useParams<{ id: string }>();
  const { data } = useApp();
  const navigate = useNavigate();
  const player = data.players.find((p) => p.id === id);

  if (!player || !id) {
    return (
      <Card className="mt-4">
        <Empty icon={<UserX size={24} />} title="Spieler nicht gefunden">
          <Button onClick={() => navigate('/spieler')}>Zu den Spielern</Button>
        </Empty>
      </Card>
    );
  }

  const all = playerStats(data).filter((s) => s.evenings > 0);
  const me = playerStats(data).find((s) => s.playerId === id)!;
  const rank = all.findIndex((s) => s.playerId === id) + 1;
  const partners = duoStats(data).filter((d) => d.players.includes(id));
  const streak = streaks(data).find((s) => s.playerId === id);
  const evenings = sortEveningsDesc(data.evenings).filter((e) => teamOf(e, id) !== null);
  const timeline = chritzTimeline({ ...data, evenings }).map((p) => ({ date: p.date, [id]: p[id] }));

  return (
    <div className="space-y-4">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm font-semibold text-ink-3 active:text-ink pt-1">
        <ChevronLeft size={18} /> Zurück
      </button>

      <div className="flex items-center gap-4">
        <Avatar name={player.name} size={60} />
        <div>
          <h1 className="text-[28px] font-bold text-ink leading-tight">{player.name}</h1>
          <p className="text-sm text-ink-3">
            {rank > 0 ? `Rang ${rank} von ${all.length}` : 'Noch keine Abende'} · {me.evenings} Abende
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl p-4 bg-brand text-[#06140d] row-span-2 flex flex-col justify-between">
          <p className="text-xs font-semibold opacity-70">Chritz total</p>
          <p className="text-6xl font-bold leading-none">{me.chritz}</p>
          <p className="text-xs font-semibold opacity-70">
            Ø {me.evenings ? (me.chritz / me.evenings).toFixed(1) : '0'} pro Abend
          </p>
        </div>
        <StatTile label="Siegquote" value={pct(me.winRate)} sub={`${me.sieg} von ${me.games} Partien`} />
        <StatTile label="Abendsiege" value={me.eveningWins} sub={`von ${me.evenings} Abenden`} />
      </div>

      <Card className="grid grid-cols-3 divide-x divide-line">
        {CHRITZ_TYPES.map((t) => (
          <div key={t} className="py-3 text-center">
            <p className="text-lg">{CHRITZ_ICONS[t]}</p>
            <p className="text-xl font-bold text-ink">{me[t]}</p>
            <p className="text-[11px] text-ink-3">{CHRITZ_LABELS[t]}</p>
          </div>
        ))}
      </Card>

      {(me.avgPoints !== null || (streak && streak.longest > 0)) && (
        <div className="grid grid-cols-2 gap-3">
          {me.avgPoints !== null && <StatTile label="Ø Punkte pro Runde" value={Math.round(me.avgPoints)} sub={`Weis total ${me.weis}`} />}
          {streak && streak.longest > 0 && (
            <StatTile label="Längste Siegesserie" value={streak.longest} sub={streak.current > 0 ? `aktuell ${streak.current}` : undefined} />
          )}
        </div>
      )}

      {partners.length > 0 && (
        <Card className="p-4">
          <Label className="mb-3">Mit Partner</Label>
          <div className="space-y-3">
            {partners.map((d) => {
              const partner = d.players.find((p) => p !== id)!;
              return (
                <div key={d.key} className="flex items-center gap-3">
                  <Avatar name={nameOf(data, partner)} size={32} />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-ink truncate">{nameOf(data, partner)}</p>
                    <p className="text-xs text-ink-3">
                      {d.wins}/{d.games} Partien · {d.evenings} Abende
                    </p>
                  </div>
                  <span className="font-bold text-ink tabular">{pct(d.winRate)}</span>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {timeline.length > 1 && (
        <Card className="p-4">
          <Label className="mb-3">Chritz-Verlauf</Label>
          <TimelineChart points={timeline} players={[{ id, name: player.name, color: playerColor(data, id) }]} hideLegend />
        </Card>
      )}

      <Card className="overflow-hidden">
        <div className="px-4 pt-4 pb-2">
          <Label>Abende</Label>
        </div>
        {evenings.length === 0 && <p className="px-4 pb-4 text-sm text-ink-3">Noch keine Abende.</p>}
        {evenings.map((ev) => {
          const t = teamOf(ev, id)!;
          const cp = chritzPoints(data.chritz.filter((c) => c.eveningId === ev.id));
          const partner = ev.teams[t].filter((p) => p !== id);
          const won = cp[t] > cp[1 - t];
          return (
            <Link
              key={ev.id}
              to={`/abende/${ev.id}`}
              className="flex items-center gap-3 px-4 py-3 border-t border-line active:bg-surface-2"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-ink">{formatDate(ev.date, 'short')}</p>
                <p className="text-xs text-ink-3 truncate">
                  mit {teamName(data, partner) || '–'} <span className="mx-1">vs</span> {teamName(data, ev.teams[1 - t])}
                </p>
              </div>
              <span
                className={cx(
                  'text-sm font-bold tabular px-2.5 py-1 rounded-full',
                  won ? 'bg-gold/15 text-gold' : 'bg-surface-2 text-ink-3',
                )}
              >
                {cp[t]} : {cp[1 - t]}
              </span>
              <ChevronRight size={16} className="text-ink-3" />
            </Link>
          );
        })}
      </Card>
    </div>
  );
}

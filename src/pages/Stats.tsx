import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, Flame, Info } from 'lucide-react';
import { useApp } from '../data/store';
import { playerColor } from '../lib/colors';
import { formatDate, nameOf, pct, teamName } from '../lib/format';
import {
  chritzTimeline,
  duoStats,
  headToHead,
  playerStats,
  records,
  scopeToSeason,
  streaks,
  type Season,
} from '../lib/stats';
import { CHRITZ_ICONS } from '../lib/types';
import { TimelineChart } from '../components/charts';
import { SeasonChips } from '../components/SeasonChips';
import { Card, Empty, Label, PageHeader, StatTile } from '../components/ui';
import { cx } from '../lib/cx';

export default function Stats() {
  const { data } = useApp();
  const [season, setSeason] = useState<Season>('all');
  const d = scopeToSeason(data, season);

  if (data.evenings.length === 0) {
    return (
      <div className="space-y-4">
        <PageHeader title="Statistik" />
        <Card>
          <Empty icon={<BarChart3 size={24} />} title="Noch keine Daten" text="Nach dem ersten Jassabend gibt es hier Statistiken." />
        </Card>
      </div>
    );
  }

  const ps = playerStats(d).filter((s) => s.evenings > 0);
  const duos = duoStats(d);
  const h2h = headToHead(d);
  const rec = records(d);
  const st = streaks(d);
  const timeline = chritzTimeline(d);
  const active = ps.map((s) => s.playerId);
  const decidedGames = d.chritz.filter((c) => c.type === 'sieg').length;
  const hasRounds = d.rounds.length > 0;

  return (
    <div className="space-y-6">
      <PageHeader title="Statistik" subtitle={season === 'all' ? 'Alle Saisons' : `Saison ${season}`} />
      <SeasonChips data={data} value={season} onChange={setSeason} />

      <div className="grid grid-cols-2 gap-3">
        <StatTile label="Abende" value={d.evenings.length} />
        <StatTile label="Partien" value={decidedGames} sub="entschieden" />
        <StatTile label="Matches" value={d.chritz.filter((c) => c.type === 'match').length} />
        <StatTile label="Runden" value={hasRounds ? d.rounds.length : '–'} sub={hasRounds ? 'auf der Tafel' : 'ab Tafel-Abenden'} />
      </div>

      {/* ───────── Siege & Partner ───────── */}
      <Section title="Siege & Partner">
        <Card className="overflow-hidden">
          <div className="grid grid-cols-[1fr_52px_52px_56px] gap-2 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-ink-3 border-b border-line">
            <span>Spieler</span>
            <span className="text-right">Siege</span>
            <span className="text-right">Quote</span>
            <span className="text-right" title="Abende mit mehr Chritz als der Gegner">Abende</span>
          </div>
          {[...ps]
            .sort((a, b) => (b.winRate ?? -1) - (a.winRate ?? -1) || b.sieg - a.sieg)
            .map((s) => (
              <Link
                key={s.playerId}
                to={`/spieler/${s.playerId}`}
                className="grid grid-cols-[1fr_52px_52px_56px] gap-2 px-4 py-3 items-center border-b border-line last:border-0 active:bg-surface-2"
              >
                <span className="flex items-center gap-2 min-w-0">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: playerColor(data, s.playerId) }} />
                  <span className="font-semibold text-ink truncate">{nameOf(data, s.playerId)}</span>
                </span>
                <span className="text-right text-ink-2 tabular text-sm">
                  {s.sieg}/{s.games}
                </span>
                <span className="text-right font-bold text-ink tabular">{pct(s.winRate)}</span>
                <span className="text-right text-ink-2 tabular text-sm">
                  {s.eveningWins}/{s.evenings}
                </span>
              </Link>
            ))}
        </Card>

        {duos.length > 0 && (
          <Card className="p-4">
            <Label className="mb-3">Duos</Label>
            <div className="space-y-3.5">
              {duos.map((duo, i) => (
                <div key={duo.key}>
                  <div className="flex items-baseline gap-2">
                    <span className="font-semibold text-ink truncate flex-1">
                      {teamName(data, duo.players)}
                      {i === 0 && duo.games > 0 && <span className="ml-1.5 text-xs text-gold font-bold">Bestes Duo</span>}
                    </span>
                    <span className="text-sm font-bold text-ink tabular">{pct(duo.winRate)}</span>
                  </div>
                  <div className="mt-1.5 h-1.5 rounded-full bg-surface-3 overflow-hidden">
                    <div className="h-full rounded-full bg-brand" style={{ width: `${(duo.winRate ?? 0) * 100}%` }} />
                  </div>
                  <p className="text-xs text-ink-3 mt-1">
                    {duo.wins} von {duo.games} Partien · {duo.evenings} Abende · Ø {(duo.chritz / duo.evenings).toFixed(1)} Chritz
                  </p>
                </div>
              ))}
            </div>
          </Card>
        )}

        {h2h.length > 0 && (
          <Card className="p-4">
            <Label className="mb-3">Direktvergleich (Partien)</Label>
            <div className="space-y-4">
              {h2h.map((h) => {
                const total = h.wins[0] + h.wins[1];
                return (
                  <div key={h.key}>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="flex-1 min-w-0 truncate text-ink">{teamName(data, h.sides[0])}</span>
                      <span className="font-bold text-ink tabular text-base">
                        {h.wins[0]} : {h.wins[1]}
                      </span>
                      <span className="flex-1 min-w-0 truncate text-ink text-right">{teamName(data, h.sides[1])}</span>
                    </div>
                    <div className="flex gap-[2px] h-2 mt-1.5 rounded-full overflow-hidden bg-surface-3">
                      {total > 0 && (
                        <>
                          <div className="bg-team0 rounded-l-full" style={{ width: `${(h.wins[0] / total) * 100}%` }} />
                          <div className="bg-team1 rounded-r-full flex-1" />
                        </>
                      )}
                    </div>
                    <p className="text-xs text-ink-3 mt-1 text-center tabular">
                      {h.evenings} Abende · Chritz {h.chritz[0]} : {h.chritz[1]}
                    </p>
                  </div>
                );
              })}
            </div>
          </Card>
        )}
      </Section>

      {/* ───────── Punkte & Rekorde ───────── */}
      <Section title="Punkte & Rekorde">
        {!hasRounds && (
          <div className="flex gap-2.5 rounded-2xl border border-line bg-surface-2/50 p-3.5 text-sm text-ink-2">
            <Info size={18} className="text-ink-3 flex-shrink-0 mt-0.5" />
            Punkte-Statistiken gibt es für Abende, die mit der Tafel gespielt werden. Frühere Abende haben nur Chritz.
          </div>
        )}
        {hasRounds && (
          <Card className="overflow-hidden">
            <div className="grid grid-cols-[1fr_64px_64px_44px] gap-2 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-ink-3 border-b border-line">
              <span>Spieler</span>
              <span className="text-right">Ø Runde</span>
              <span className="text-right">Weis</span>
              <span className="text-right">{CHRITZ_ICONS.match}</span>
            </div>
            {[...ps]
              .sort((a, b) => (b.avgPoints ?? 0) - (a.avgPoints ?? 0))
              .map((s) => (
                <div
                  key={s.playerId}
                  className="grid grid-cols-[1fr_64px_64px_44px] gap-2 px-4 py-3 items-center border-b border-line last:border-0"
                >
                  <span className="font-semibold text-ink truncate">{nameOf(data, s.playerId)}</span>
                  <span className="text-right font-bold text-ink tabular">{s.avgPoints === null ? '–' : Math.round(s.avgPoints)}</span>
                  <span className="text-right text-ink-2 tabular text-sm">{s.weis}</span>
                  <span className="text-right text-ink-2 tabular text-sm">{s.match}</span>
                </div>
              ))}
          </Card>
        )}
        <Card className="divide-y divide-line overflow-hidden">
          {Object.values(rec)
            .filter((r): r is NonNullable<typeof r> => r !== null)
            .map((r) => (
              <Link key={r.label} to={`/abende/${r.eveningId}`} className="flex items-center gap-3 px-4 py-3 active:bg-surface-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-ink-3">{r.label}</p>
                  <p className="text-sm text-ink truncate mt-0.5">
                    {teamName(data, r.team)} <span className="text-ink-3">· {formatDate(r.date, 'short')}</span>
                  </p>
                </div>
                <span className="text-lg font-bold text-gold tabular">{r.value}</span>
              </Link>
            ))}
          {Object.values(rec).every((r) => r === null) && <p className="px-4 py-4 text-sm text-ink-3">Noch keine Rekorde.</p>}
        </Card>
      </Section>

      {/* ───────── Verlauf & Saison ───────── */}
      <Section title="Verlauf & Serien">
        {timeline.length > 1 && (
          <Card className="p-4">
            <Label className="mb-3">Chritz kumuliert</Label>
            <TimelineChart
              points={timeline}
              players={active.map((id) => ({ id, name: nameOf(data, id), color: playerColor(data, id) }))}
            />
          </Card>
        )}
        <Card className="overflow-hidden">
          <div className="px-4 pt-4 pb-2">
            <Label>Siegesserien (Partien)</Label>
          </div>
          {st
            .filter((s) => active.includes(s.playerId))
            .sort((a, b) => b.current - a.current || b.longest - a.longest)
            .map((s) => (
              <div key={s.playerId} className="flex items-center gap-3 px-4 py-3 border-t border-line">
                <span className="font-semibold text-ink w-20 truncate">{nameOf(data, s.playerId)}</span>
                <div className="flex gap-1 flex-1">
                  {s.form.map((f, i) => (
                    <span
                      key={i}
                      title={f === 'W' ? 'Sieg' : 'Niederlage'}
                      className={cx(
                        'w-4 h-4 rounded text-[9px] font-bold flex items-center justify-center',
                        f === 'W' ? 'bg-brand/80 text-[#06140d]' : 'bg-surface-3 text-ink-3',
                      )}
                    >
                      {f === 'W' ? 'S' : 'N'}
                    </span>
                  ))}
                </div>
                <span className="text-right text-xs text-ink-3 leading-tight">
                  {s.current > 1 && (
                    <span className="inline-flex items-center gap-0.5 text-gold font-bold text-sm">
                      <Flame size={14} />
                      {s.current}
                    </span>
                  )}
                  <span className="block">Rekord {s.longest}</span>
                </span>
              </div>
            ))}
          <p className="px-4 py-2.5 text-[11px] text-ink-3 border-t border-line">S = Sieg, N = Niederlage · letzte 8 Partien</p>
        </Card>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-bold text-ink">{title}</h2>
      {children}
    </section>
  );
}

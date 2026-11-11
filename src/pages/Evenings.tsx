import { Link } from 'react-router-dom';
import { CalendarDays, ChevronRight, Plus } from 'lucide-react';
import { useApp } from '../data/store';
import { teamName } from '../lib/format';
import { sortEveningsDesc } from '../lib/rotation';
import { chritzPoints } from '../lib/stats';
import { Button, Card, Empty, PageHeader, TeamDot } from '../components/ui';
import { cx } from '../lib/cx';

export default function Evenings() {
  const { data } = useApp();
  const evenings = sortEveningsDesc(data.evenings);

  const groups = new Map<string, typeof evenings>();
  for (const ev of evenings) {
    const key = new Date(`${ev.date}T12:00:00`).toLocaleDateString('de-CH', { month: 'long', year: 'numeric' });
    groups.set(key, [...(groups.get(key) ?? []), ev]);
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Abende"
        subtitle={`${evenings.length} erfasst`}
        right={
          <Link to="/abende/neu">
            <Button size="sm">
              <Plus size={16} /> Nachtragen
            </Button>
          </Link>
        }
      />

      {evenings.length === 0 ? (
        <Card>
          <Empty icon={<CalendarDays size={24} />} title="Noch keine Abende" text="Starte einen Jassabend auf der Startseite." />
        </Card>
      ) : (
        [...groups.entries()].map(([month, list]) => (
          <section key={month} className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-ink-3 px-1">{month}</p>
            <Card className="divide-y divide-line overflow-hidden">
              {list.map((ev) => {
                const cp = chritzPoints(data.chritz.filter((c) => c.eveningId === ev.id));
                return (
                  <Link
                    key={ev.id}
                    to={`/abende/${ev.id}`}
                    className="flex items-center gap-3 px-4 py-3 active:bg-surface-2 transition-colors"
                  >
                    <div className="w-11 text-center flex-shrink-0">
                      <p className="text-lg font-bold text-ink leading-none">{new Date(`${ev.date}T12:00:00`).getDate()}</p>
                      <p className="text-[11px] text-ink-3 mt-0.5">
                        {new Date(`${ev.date}T12:00:00`).toLocaleDateString('de-CH', { weekday: 'short' })}
                      </p>
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      {[0, 1].map((t) => (
                        <div key={t} className="flex items-center gap-2 text-sm">
                          <TeamDot team={t as 0 | 1} className="w-2 h-2" />
                          <span className="truncate flex-1 text-ink-2">{teamName(data, ev.teams[t])}</span>
                          <span
                            className={cx(
                              'font-bold tabular',
                              cp[t] > cp[1 - t] ? 'text-gold' : 'text-ink-3',
                            )}
                          >
                            {cp[t]}
                          </span>
                        </div>
                      ))}
                    </div>
                    {ev.status === 'active' ? (
                      <span className="text-[10px] font-bold uppercase text-brand border border-brand/40 rounded-full px-2 py-0.5">
                        Live
                      </span>
                    ) : (
                      <ChevronRight size={18} className="text-ink-3 flex-shrink-0" />
                    )}
                  </Link>
                );
              })}
            </Card>
          </section>
        ))
      )}
      {evenings.length > 0 && (
        <p className="text-xs text-ink-3 text-center">Zahl = Chritz an diesem Abend (Sieg zählt 2)</p>
      )}
    </div>
  );
}

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight, Play, Trophy, UserPlus } from 'lucide-react';
import { useApp } from '../data/store';
import { activeEvening, currentGame, startEvening } from '../lib/actions';
import { formatDate, pct, teamName } from '../lib/format';
import { todayIso } from '../lib/ids';
import { PAIRING_LABELS, rotationInfo, sortEveningsDesc } from '../lib/rotation';
import { gameWinner, other, roundsOfGame, totals } from '../lib/scoring';
import { myTeam, resolveMe } from '../lib/me';
import { chritzPoints, playerStats, scopeToSeason, type Season } from '../lib/stats';
import { CHRITZ_ICONS, type AppData } from '../lib/types';
import { Avatar, Button, Card, Empty, Label, TeamDot } from '../components/ui';
import { cx } from '../lib/cx';
import { SyncBadge } from '../components/SyncBadge';
import { SeasonChips } from '../components/SeasonChips';
import { CloudBanner } from '../components/CloudBanner';

export default function Home() {
  const { data, sync } = useApp();
  const [season, setSeason] = useState<Season>('all');
  const active = activeEvening(data);

  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between pt-1">
        <div>
          <p className="text-[28px] font-bold leading-tight tracking-tight text-ink">Jass-Stats</p>
          <p className="text-sm text-ink-3">{data.evenings.length} Abende erfasst</p>
        </div>
        <SyncBadge sync={sync} />
      </header>

      <CloudBanner />

      {active ? <LiveCard data={data} eveningId={active.id} /> : <StartCard data={data} />}

      <Ranking data={data} season={season} setSeason={setSeason} />

      <LastEvening data={data} />
    </div>
  );
}

function StartCard({ data }: { data: AppData }) {
  const { commit } = useApp();
  const navigate = useNavigate();
  const rot = rotationInfo(data);
  const [choice, setChoice] = useState<number | null>(null);

  if (!rot) {
    return (
      <Card className="p-5">
        <p className="text-lg font-bold text-ink">Willkommen!</p>
        <p className="text-sm text-ink-2 mt-1">
          Erfasse zuerst die vier Spieler. Danach startest du jeden Jassabend mit einem Tap.
        </p>
        <Button variant="primary" className="w-full mt-4" onClick={() => navigate('/spieler')}>
          <UserPlus size={18} /> Spieler erfassen ({data.players.length}/4)
        </Button>
      </Card>
    );
  }

  const idx = choice ?? rot.nextIndex;
  const teams = rot.pairings[idx];
  const start = () => {
    commit((d) => startEvening(d, teams, todayIso()));
    navigate('/tafel');
  };

  return (
    <Card className="p-5 overflow-hidden relative">
      <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-brand/10 blur-2xl pointer-events-none" />
      <div className="flex items-center justify-between">
        <Label>Nächster Jassabend</Label>
        <div className="flex gap-1">
          {PAIRING_LABELS.map((l, i) => (
            <button
              key={l}
              onClick={() => setChoice(i)}
              aria-label={`Paarung ${l}`}
              className={cx(
                'w-8 h-8 rounded-full text-xs font-bold border transition-colors',
                i === idx ? 'bg-ink text-bg border-ink' : 'bg-surface-2 text-ink-3 border-line',
              )}
            >
              {l}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        {[0, 1].map((t) => (
          <div key={t} className={cx('min-w-0', t === 1 && 'order-3 text-right')}>
            <div className={cx('flex items-center gap-1.5 mb-1', t === 1 && 'justify-end')}>
              <TeamDot team={t as 0 | 1} />
              <span className="text-[11px] font-semibold text-ink-3 uppercase tracking-wider">Team {t + 1}</span>
            </div>
            {teams[t].map((id) => (
              <p key={id} className="text-lg font-bold text-ink leading-snug truncate">
                {data.players.find((p) => p.id === id)?.name}
              </p>
            ))}
          </div>
        ))}
        <span className="order-2 text-sm font-bold text-ink-3">vs</span>
      </div>
      <p className="text-xs text-ink-3 mt-3">
        Paarung {PAIRING_LABELS[idx]}
        {choice === null && rot.lastIndex >= 0 && ` · gemäss Rotation (zuletzt ${PAIRING_LABELS[rot.lastIndex]})`}
      </p>
      <Button variant="primary" size="lg" className="w-full mt-4" onClick={start}>
        <Play size={18} fill="currentColor" /> Jassabend starten
      </Button>
    </Card>
  );
}

function LiveCard({ data, eveningId }: { data: AppData; eveningId: string }) {
  const navigate = useNavigate();
  const ev = data.evenings.find((e) => e.id === eveningId)!;
  const game = currentGame(data, eveningId);
  const t = game ? totals(roundsOfGame(data, game.id)) : [0, 0];
  const winner = game ? gameWinner(data, game.id) : null;
  const cp = chritzPoints(data.chritz.filter((c) => c.eveningId === eveningId));
  const mine = myTeam(ev, resolveMe(data));

  return (
    <button onClick={() => navigate('/tafel')} className="block w-full text-left">
      <Card className="p-5 border-brand/40 relative overflow-hidden active:bg-surface-2 transition-colors">
        <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-brand/15 blur-2xl pointer-events-none" />
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand">
            <span className="w-2 h-2 rounded-full bg-brand animate-pulse" /> Läuft · Partie {game?.number ?? 1}
          </span>
          <span className="text-xs text-ink-3">{formatDate(ev.date, 'short')}</span>
        </div>
        <div className="mt-4 space-y-2.5">
          {[mine, other(mine)].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <TeamDot team={i as 0 | 1} />
              <span className="flex-1 min-w-0 font-semibold text-ink truncate">{teamName(data, ev.teams[i])}</span>
              {cp[i] > 0 && <span className="text-xs font-semibold text-gold">{cp[i]} Chritz</span>}
              <span className="text-2xl font-bold tabular text-ink w-16 text-right">
                {t[i]}
                {winner === i && <Trophy size={14} className="inline ml-1 text-gold -mt-1" />}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-center gap-1 text-sm font-semibold text-brand">
          Zur Tafel <ChevronRight size={16} />
        </div>
      </Card>
    </button>
  );
}

function Ranking({ data, season, setSeason }: { data: AppData; season: Season; setSeason: (s: Season) => void }) {
  const stats = playerStats(scopeToSeason(data, season)).filter((s) => s.evenings > 0);
  const max = Math.max(1, ...stats.map((s) => s.chritz));

  return (
    <section className="space-y-3">
      <div className="flex items-end justify-between">
        <h2 className="text-xl font-bold text-ink">Rangliste</h2>
        <Link to="/statistik" className="text-sm font-semibold text-brand">
          Statistik
        </Link>
      </div>
      <SeasonChips data={data} value={season} onChange={setSeason} />
      {stats.length === 0 ? (
        <Card>
          <Empty icon={<Trophy size={24} />} title="Noch keine Abende" text="Sobald ihr jasst, erscheint hier die Rangliste." />
        </Card>
      ) : (
        <Card className="divide-y divide-line overflow-hidden">
          {stats.map((s, i) => {
            const name = data.players.find((p) => p.id === s.playerId)?.name ?? '?';
            return (
              <Link
                key={s.playerId}
                to={`/spieler/${s.playerId}`}
                className="flex items-center gap-3 px-4 py-3.5 active:bg-surface-2 transition-colors"
              >
                <span
                  className={cx(
                    'w-7 text-center text-sm font-bold flex-shrink-0',
                    i === 0 ? 'text-gold' : i === 1 ? 'text-[#c9d1ce]' : i === 2 ? 'text-[#d39463]' : 'text-ink-3',
                  )}
                >
                  {i + 1}
                </span>
                <Avatar name={name} size={38} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="font-semibold text-ink truncate">{name}</p>
                    <p className="text-xl font-bold text-ink tabular">{s.chritz}</p>
                  </div>
                  <div className="mt-1.5 h-1.5 rounded-full bg-surface-3 overflow-hidden">
                    <div className="h-full rounded-full bg-brand" style={{ width: `${(s.chritz / max) * 100}%` }} />
                  </div>
                  <div className="text-xs text-ink-3 mt-1.5 flex items-center justify-between gap-2">
                    <span className="truncate">
                      {s.evenings} Abende · {pct(s.winRate)} Siege
                    </span>
                    <span className="flex-shrink-0 tabular whitespace-nowrap">
                      {CHRITZ_ICONS.match}
                      {s.match} {CHRITZ_ICONS.bergpreis}
                      {s.bergpreis} {CHRITZ_ICONS.sieg}
                      {s.sieg}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </Card>
      )}
    </section>
  );
}

function LastEvening({ data }: { data: AppData }) {
  const last = sortEveningsDesc(data.evenings).find((e) => e.status === 'done');
  if (!last) return null;
  const cp = chritzPoints(data.chritz.filter((c) => c.eveningId === last.id));
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-bold text-ink">Letzter Abend</h2>
      <Link to={`/abende/${last.id}`} className="block">
        <Card className="p-4 active:bg-surface-2 transition-colors">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-ink-2">{formatDate(last.date)}</p>
            <ChevronRight size={18} className="text-ink-3" />
          </div>
          <div className="mt-3 space-y-2">
            {[0, 1].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <TeamDot team={i as 0 | 1} />
                <span className="flex-1 min-w-0 truncate text-ink">{teamName(data, last.teams[i])}</span>
                <span className={cx('font-bold tabular', cp[i] >= cp[1 - i] && cp[i] > 0 ? 'text-gold' : 'text-ink-2')}>
                  {cp[i]} Chritz
                </span>
              </div>
            ))}
          </div>
        </Card>
      </Link>
    </section>
  );
}

import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Pencil, RotateCcw, Trash2, Grid2x2, Check, X } from 'lucide-react';
import { useApp } from '../data/store';
import { activeEvening, addChritz, deleteEvening, removeChritz, reopenEvening } from '../lib/actions';
import { formatDate, teamName } from '../lib/format';
import { eveningSummary } from '../lib/stats';
import { CHRITZ_ICONS, CHRITZ_LABELS, CHRITZ_TYPES, CHRITZ_VALUE, type TeamIndex } from '../lib/types';
import { GameChart } from '../components/charts';
import { Button, Card, ConfirmModal, Empty, Label, TeamDot } from '../components/ui';
import { cx } from '../lib/cx';

export default function EveningDetail() {
  const { id } = useParams<{ id: string }>();
  const { data, commit } = useApp();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [confirm, setConfirm] = useState<'delete' | null>(null);

  const summary = id ? eveningSummary(data, id) : null;
  if (!summary) {
    return (
      <Card className="mt-4">
        <Empty icon={<X size={24} />} title="Abend nicht gefunden">
          <Button onClick={() => navigate('/abende')}>Zu den Abenden</Button>
        </Empty>
      </Card>
    );
  }

  const { evening, points, byType, games } = summary;
  const names: [string, string] = [teamName(data, evening.teams[0]), teamName(data, evening.teams[1])];
  const isActive = evening.status === 'active';
  const otherActive = activeEvening(data);
  const leader: TeamIndex | null = points[0] === points[1] ? null : points[0] > points[1] ? 0 : 1;
  const partien = games.filter((g) => g.rounds.length > 0).length || byType[0].sieg + byType[1].sieg;

  return (
    <div className="space-y-4">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm font-semibold text-ink-3 active:text-ink pt-1">
        <ChevronLeft size={18} /> Zurück
      </button>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-ink-3">
          {isActive ? <span className="text-brand">● Läuft</span> : 'Abend-Rückblick'}
        </p>
        <h1 className="text-2xl font-bold text-ink mt-0.5">{formatDate(evening.date)}</h1>
      </div>

      {/* Ergebnis */}
      <Card className="p-4">
        <div className="grid grid-cols-2 gap-3">
          {([0, 1] as TeamIndex[]).map((t) => (
            <div
              key={t}
              className={cx(
                'rounded-xl p-3 border',
                leader === t ? 'border-gold/50 bg-gold/[0.06]' : 'border-line bg-surface-2',
              )}
            >
              <div className="flex items-center gap-1.5">
                <TeamDot team={t} />
                <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-3">Team {t + 1}</span>
                {leader === t && <span className="ml-auto text-sm">👑</span>}
              </div>
              <p className="font-semibold text-ink mt-1.5 leading-snug">{names[t]}</p>
              <p className="text-4xl font-bold text-ink mt-2 leading-none">{points[t]}</p>
              <p className="text-xs text-ink-3 mt-1">Chritz</p>
              <div className="mt-2 space-y-0.5">
                {CHRITZ_TYPES.map((type) =>
                  byType[t][type] ? (
                    <p key={type} className="text-xs text-ink-2 flex justify-between">
                      <span>
                        {CHRITZ_ICONS[type]} {CHRITZ_LABELS[type]}
                      </span>
                      <span className="font-semibold">×{byType[t][type]}</span>
                    </p>
                  ) : null,
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-2 mt-3 text-center">
          <Mini label="Partien" value={partien} />
          <Mini label="Runden" value={summary.rounds || '–'} />
          <Mini label="Matches" value={byType[0].match + byType[1].match} />
        </div>
      </Card>

      {isActive && (
        <Button variant="primary" className="w-full" onClick={() => navigate('/tafel')}>
          <Grid2x2 size={18} /> Zur Tafel
        </Button>
      )}

      {/* Partien */}
      {games
        .filter((g) => g.rounds.length > 0)
        .map((g) => (
          <Card key={g.game.id} className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <Label>Partie {g.game.number}</Label>
              <span className="text-xs font-semibold text-ink-2">
                {g.winner !== null ? `🏆 ${names[g.winner]}` : 'nicht beendet'}
              </span>
            </div>
            <div className="flex items-baseline gap-2 tabular">
              <span className="text-2xl font-bold text-ink">{g.totals[0]}</span>
              <span className="text-ink-3">:</span>
              <span className="text-2xl font-bold text-ink">{g.totals[1]}</span>
              <span className="text-xs text-ink-3 ml-auto">{g.rounds.length} {g.rounds.length === 1 ? 'Runde' : 'Runden'}</span>
            </div>
            <GameChart series={g.series} names={names} />
            <div className="grid grid-cols-3 gap-2 text-center">
              <Mini label="Matches" value={`${g.matches[0]} : ${g.matches[1]}`} />
              <Mini label="Weis" value={`${g.weis[0]} : ${g.weis[1]}`} />
              <Mini
                label="Höchste Runde"
                value={g.highest ? g.highest.points : '–'}
                dot={g.highest ? g.highest.team : undefined}
              />
            </div>
          </Card>
        ))}

      {/* Chritz bearbeiten */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <Label>Chritz ({summary.chritz.length})</Label>
          <button
            onClick={() => setEditing(!editing)}
            className={cx(
              'inline-flex items-center gap-1 text-sm font-semibold',
              editing ? 'text-brand' : 'text-ink-2',
            )}
          >
            {editing ? (
              <>
                <Check size={16} /> Fertig
              </>
            ) : (
              <>
                <Pencil size={14} /> Bearbeiten
              </>
            )}
          </button>
        </div>
        {summary.chritz.length === 0 && !editing && <p className="text-sm text-ink-3">Keine Chritz an diesem Abend.</p>}
        <div className="space-y-1.5">
          {[...summary.chritz]
            .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
            .map((c) => (
              <div key={c.id} className="flex items-center gap-2.5 text-sm py-1">
                <span className="w-6 text-center">{CHRITZ_ICONS[c.type]}</span>
                <span className="text-ink flex-shrink-0">{CHRITZ_LABELS[c.type]}</span>
                <TeamDot team={c.team} className="w-2 h-2 ml-1" />
                <span className="text-ink-2 truncate flex-1">{names[c.team]}</span>
                {c.auto && !editing && <span className="text-[10px] text-ink-3 uppercase tracking-wider">auto</span>}
                <span className="text-xs font-semibold text-gold">+{CHRITZ_VALUE[c.type]}</span>
                {editing && (
                  <button
                    onClick={() => commit((d) => removeChritz(d, c.id))}
                    aria-label="Chritz entfernen"
                    className="p-1 text-danger rounded-full active:bg-danger/10"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            ))}
        </div>
        {editing && (
          <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-line">
            {([0, 1] as TeamIndex[]).map((t) => (
              <div key={t} className="space-y-1.5 min-w-0">
                <p className="text-xs text-ink-3 flex items-center gap-1.5 truncate">
                  <TeamDot team={t} className="w-2 h-2" /> {names[t]}
                </p>
                {CHRITZ_TYPES.map((type) => (
                  <button
                    key={type}
                    onClick={() => commit((d) => addChritz(d, evening.id, type, t))}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-surface-2 border border-line text-sm font-medium text-ink active:bg-surface-3"
                  >
                    {CHRITZ_ICONS[type]} + {CHRITZ_LABELS[type]}
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}
      </Card>

      <div className="flex gap-2">
        {!isActive && !otherActive && (
          <Button
            size="sm"
            className="flex-1"
            onClick={() => {
              commit((d) => reopenEvening(d, evening.id));
              navigate('/tafel');
            }}
          >
            <RotateCcw size={16} /> Wieder öffnen
          </Button>
        )}
        <Button size="sm" variant="danger" className="flex-1" onClick={() => setConfirm('delete')}>
          <Trash2 size={16} /> Abend löschen
        </Button>
      </div>

      <p className="text-center text-xs text-ink-3">
        <Link to="/abende" className="font-semibold text-ink-2">
          Alle Abende
        </Link>
      </p>

      {confirm === 'delete' && (
        <ConfirmModal
          title="Abend löschen?"
          text="Alle Partien, Runden und Chritz dieses Abends werden endgültig gelöscht."
          confirmLabel="Löschen"
          danger
          onCancel={() => setConfirm(null)}
          onConfirm={() => {
            commit((d) => deleteEvening(d, evening.id));
            navigate('/abende', { replace: true });
          }}
        />
      )}
    </div>
  );
}

function Mini({ label, value, dot }: { label: string; value: React.ReactNode; dot?: TeamIndex }) {
  return (
    <div className="rounded-xl bg-surface-2 border border-line py-2 px-1">
      <p className="text-[15px] font-bold text-ink tabular inline-flex items-center gap-1.5 justify-center">
        {dot !== undefined && <TeamDot team={dot} className="w-2 h-2" />}
        {value}
      </p>
      <p className="text-[11px] text-ink-3 mt-0.5">{label}</p>
    </div>
  );
}

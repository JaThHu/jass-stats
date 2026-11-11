import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Flag, Grid2x2, Plus, Undo2, Zap } from 'lucide-react';
import { useApp } from '../data/store';
import {
  activeEvening,
  addRound,
  currentGame,
  deleteRound,
  endEvening,
  resolveEvent,
  startGame,
  updateRound,
} from '../lib/actions';
import { formatDate, teamName } from '../lib/format';
import { sortEveningsDesc } from '../lib/rotation';
import {
  gameWinner,
  gamesOfEvening,
  isWeisOnly,
  pendingEvents,
  progression,
  roundsOfGame,
  weisPair,
} from '../lib/scoring';
import { chritzPoints } from '../lib/stats';
import { BERGPREIS_POINTS, CHRITZ_ICONS, CHRITZ_TYPES, type AppData, type Round, type TeamIndex } from '../lib/types';
import { BoardSide } from '../components/tafel/Board';
import { RoundSheet } from '../components/tafel/RoundSheet';
import { ChritzPrompt, GameWonModal } from '../components/tafel/ChritzPrompt';
import { Button, Card, ConfirmModal, Empty, Label, TeamDot } from '../components/ui';
import { cx } from '../lib/cx';

type SheetState = { team: TeamIndex; round: Round | null } | null;

export default function Tafel() {
  const { data } = useApp();
  const evening = activeEvening(data);
  if (!evening) return <NoEvening data={data} />;
  return <LiveTafel key={evening.id} data={data} eveningId={evening.id} />;
}

function NoEvening({ data }: { data: AppData }) {
  const navigate = useNavigate();
  const last = sortEveningsDesc(data.evenings)[0];
  return (
    <Card className="mt-4">
      <Empty icon={<Grid2x2 size={24} />} title="Kein Jassabend aktiv" text="Starte einen Abend, dann erscheint hier die Tafel.">
        <div className="space-y-2">
          <Button variant="primary" className="w-full" onClick={() => navigate('/')}>
            Jassabend starten
          </Button>
          {last && (
            <Button variant="ghost" className="w-full" onClick={() => navigate(`/abende/${last.id}`)}>
              Letzten Abend ansehen
            </Button>
          )}
        </div>
      </Empty>
    </Card>
  );
}

function LiveTafel({ data, eveningId }: { data: AppData; eveningId: string }) {
  const { commit } = useApp();
  const navigate = useNavigate();
  const [sheet, setSheet] = useState<SheetState>(null);
  const [wonGame, setWonGame] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<'undo' | 'end' | 'delete' | null>(null);
  const [lastMultiplier, setLastMultiplier] = useState(1);

  const evening = data.evenings.find((e) => e.id === eveningId)!;
  const game = currentGame(data, eveningId);
  const names: [string, string] = [teamName(data, evening.teams[0]), teamName(data, evening.teams[1])];

  if (!game) {
    return (
      <Card className="mt-4">
        <Empty icon={<Grid2x2 size={24} />} title="Keine Partie offen">
          <Button variant="primary" onClick={() => commit((d) => startGame(d, eveningId))}>
            Neue Partie starten
          </Button>
        </Empty>
      </Card>
    );
  }

  const rounds = roundsOfGame(data, game.id);
  const steps = progression(rounds);
  const total = steps.length ? steps[steps.length - 1].after : [0, 0];
  const winner = gameWinner(data, game.id);
  const bergpreisDone = total[0] >= BERGPREIS_POINTS || total[1] >= BERGPREIS_POINTS;
  const pending = pendingEvents(data, game.id);
  const prompt = !sheet && !confirm ? pending[0] : undefined;
  const games = gamesOfEvening(data, eveningId);
  const eveningChritz = data.chritz.filter((c) => c.eveningId === eveningId);
  const cp = chritzPoints(eveningChritz);
  const diff = total[0] - total[1];

  const saveRound = (input: Parameters<typeof addRound>[2]) => {
    setLastMultiplier(input.multiplier);
    if (sheet?.round) {
      const r = sheet.round;
      commit((d) => updateRound(d, { ...r, ...input }));
    } else {
      commit((d) => addRound(d, game.id, input));
    }
    setSheet(null);
  };

  const resolve = (team: TeamIndex | null) => {
    if (!prompt) return;
    commit((d) => resolveEvent(d, game.id, prompt, team));
    if (prompt.type === 'sieg' && team !== null) setWonGame(game.id);
  };

  const newGame = () => {
    commit((d) => startGame(d, eveningId));
    setWonGame(null);
  };

  const finishEvening = () => {
    commit((d) => endEvening(d, eveningId));
    navigate(`/abende/${eveningId}`);
  };

  const lastRound = rounds[rounds.length - 1];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pt-1">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-brand flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" /> Partie {game.number}
          </p>
          <p className="text-sm text-ink-3">{formatDate(evening.date)}</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => setConfirm('undo')} disabled={!lastRound} aria-label="Letzte Runde löschen">
            <Undo2 size={16} /> Rückgängig
          </Button>
        </div>
      </div>

      {/* ── Tafel ── */}
      <div className="rounded-3xl border border-line overflow-hidden bg-chalk shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
        <BoardSide
          team={1}
          name={names[1]}
          total={total[1]}
          rotated
          bergpreisDone={bergpreisDone}
          disabled={winner !== null}
          isWinner={winner === 1}
          onAdd={() => setSheet({ team: 1, round: null })}
        />
        <div className="flex items-center gap-3 px-4 py-2 bg-black/25 border-y border-line">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-xs font-semibold text-ink-2 whitespace-nowrap tabular">
            {winner !== null
              ? `🏆 ${names[winner]}`
              : diff === 0
                ? total[0] === 0
                  ? `Partie ${game.number} · los geht's`
                  : 'Gleichstand'
                : `${names[diff > 0 ? 0 : 1]} +${Math.abs(diff)}`}
          </span>
          <div className="flex-1 h-px bg-white/10" />
        </div>
        <BoardSide
          team={0}
          name={names[0]}
          total={total[0]}
          bergpreisDone={bergpreisDone}
          disabled={winner !== null}
          isWinner={winner === 0}
          onAdd={() => setSheet({ team: 0, round: null })}
        />
      </div>

      {winner !== null && (
        <Card className="p-4 border-gold/40 bg-gold/5">
          <p className="font-semibold text-ink">🏆 Partie {game.number} gewonnen – {names[winner]}</p>
          <div className="flex gap-2 mt-3">
            <Button variant="primary" size="sm" className="flex-1" onClick={newGame}>
              <Plus size={16} /> Neue Partie
            </Button>
            <Button size="sm" className="flex-1" onClick={() => setConfirm('end')}>
              <Flag size={16} /> Abend beenden
            </Button>
          </div>
        </Card>
      )}

      {/* ── Chritz heute ── */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <Label>Chritz heute</Label>
          <Link to={`/abende/${eveningId}`} className="text-xs font-semibold text-brand">
            Details
          </Link>
        </div>
        <div className="space-y-2">
          {([0, 1] as TeamIndex[]).map((t) => (
            <div key={t} className="flex items-center gap-2.5">
              <TeamDot team={t} />
              <span className="text-sm text-ink truncate flex-1 min-w-0">{names[t]}</span>
              <span className="text-sm tracking-wide">
                {CHRITZ_TYPES.flatMap((type) =>
                  eveningChritz.filter((c) => c.team === t && c.type === type).map((c) => <span key={c.id}>{CHRITZ_ICONS[type]}</span>),
                )}
              </span>
              <span className="w-8 text-right font-bold text-gold tabular">{cp[t]}</span>
            </div>
          ))}
        </div>
        {games.length > 1 && (
          <p className="text-xs text-ink-3 mt-3">
            {games
              .map((g) => {
                const w = gameWinner(data, g.id);
                return `Partie ${g.number}: ${w === null ? 'offen' : names[w]}`;
              })
              .join(' · ')}
          </p>
        )}
      </Card>

      {/* ── Runden ── */}
      <Card className="overflow-hidden">
        <div className="px-4 pt-4 pb-2 flex items-center justify-between">
          <Label>Runden ({rounds.length})</Label>
          <span className="text-[11px] text-ink-3">Antippen zum Bearbeiten</span>
        </div>
        {rounds.length === 0 ? (
          <p className="px-4 pb-4 text-sm text-ink-3">Noch keine Runde. Tippe auf ＋ bei einem Team.</p>
        ) : (
          <div className="divide-y divide-line">
            {[...steps].reverse().map((s) => {
              const n = steps.indexOf(s) + 1;
              const w = weisPair(s.round);
              return (
                <button
                  key={s.round.id}
                  onClick={() => setSheet({ team: s.round.stichTeam ?? s.round.matchTeam ?? 0, round: s.round })}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-left active:bg-surface-2 transition-colors"
                >
                  <span className="w-6 text-xs font-semibold text-ink-3 tabular">{n}</span>
                  <span className="flex-1 flex items-center gap-1.5 text-xs text-ink-3 min-w-0">
                    {s.round.multiplier > 1 && (
                      <span className="px-1.5 py-0.5 rounded bg-gold/15 text-gold font-bold">{s.round.multiplier}×</span>
                    )}
                    {s.round.matchTeam !== null && (
                      <span className="inline-flex items-center gap-0.5 text-gold font-semibold">
                        <Zap size={12} fill="currentColor" /> Match
                      </span>
                    )}
                    {isWeisOnly(s.round) && <span className="font-semibold text-ink-2">Weis</span>}
                    {!isWeisOnly(s.round) && w[0] + w[1] > 0 && <span>+Weis</span>}
                  </span>
                  {([0, 1] as TeamIndex[]).map((t) => (
                    <span key={t} className="w-[70px] flex items-center justify-end gap-1.5">
                      <span className={cx('font-semibold tabular', s.points[t] ? 'text-ink' : 'text-ink-3')}>{s.points[t]}</span>
                      <TeamDot team={t} className="w-2 h-2" />
                    </span>
                  ))}
                </button>
              );
            })}
          </div>
        )}
      </Card>

      <div className="flex gap-2">
        {winner === null && rounds.length > 0 && (
          <Button size="sm" className="flex-1" onClick={newGame}>
            <Plus size={16} /> Neue Partie
          </Button>
        )}
        <Button size="sm" variant="ghost" className="flex-1 border border-line" onClick={() => setConfirm('end')}>
          <Flag size={16} /> Abend beenden
        </Button>
      </div>

      {/* ── Overlays ── */}
      {sheet && (
        <RoundSheet
          key={sheet.round?.id ?? `new-${sheet.team}`}
          names={names}
          initialTeam={sheet.team}
          round={sheet.round}
          roundNumber={sheet.round ? rounds.findIndex((r) => r.id === sheet.round!.id) + 1 : rounds.length + 1}
          lastMultiplier={lastMultiplier}
          onSave={saveRound}
          onDelete={sheet.round ? () => setConfirm('delete') : undefined}
          onClose={() => setSheet(null)}
        />
      )}

      {prompt && <ChritzPrompt key={prompt.key} event={prompt} names={names} onResolve={resolve} />}

      {wonGame === game.id && !prompt && winner !== null && (
        <GameWonModal
          gameNumber={game.number}
          name={names[winner]}
          onNewGame={newGame}
          onEndEvening={() => {
            setWonGame(null);
            setConfirm('end');
          }}
          onClose={() => setWonGame(null)}
        />
      )}

      {confirm === 'undo' && lastRound && (
        <ConfirmModal
          title="Letzte Runde löschen?"
          text={`${names[0]} ${steps[steps.length - 1].points[0]} · ${names[1]} ${steps[steps.length - 1].points[1]}`}
          confirmLabel="Löschen"
          danger
          onCancel={() => setConfirm(null)}
          onConfirm={() => {
            commit((d) => deleteRound(d, lastRound.id));
            setConfirm(null);
          }}
        />
      )}
      {confirm === 'delete' && sheet?.round && (
        <ConfirmModal
          title="Runde löschen?"
          text="Automatisch eingetragene Chritz dieser Runde werden ebenfalls entfernt."
          confirmLabel="Löschen"
          danger
          onCancel={() => setConfirm(null)}
          onConfirm={() => {
            const id = sheet.round!.id;
            commit((d) => deleteRound(d, id));
            setConfirm(null);
            setSheet(null);
          }}
        />
      )}
      {confirm === 'end' && (
        <ConfirmModal
          title="Abend beenden?"
          text={`Chritz: ${names[0]} ${cp[0]} · ${names[1]} ${cp[1]}. Du kannst den Abend später wieder öffnen.`}
          confirmLabel="Beenden"
          onCancel={() => setConfirm(null)}
          onConfirm={() => {
            setConfirm(null);
            finishEvening();
          }}
        />
      )}
    </div>
  );
}

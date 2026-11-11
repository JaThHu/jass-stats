import type { ChritzEvent } from '../../lib/scoring';
import { BERGPREIS_POINTS, CHRITZ_ICONS, CHRITZ_LABELS, CHRITZ_VALUE, SIEG_POINTS, type TeamIndex } from '../../lib/types';
import { Button, Modal, TeamDot } from '../ui';

const TEAM_BTN = ['bg-team0 text-white active:brightness-110', 'bg-team1 text-white active:brightness-110'];

export function ChritzPrompt({
  event,
  names,
  onResolve,
}: {
  event: ChritzEvent;
  names: [string, string];
  onResolve: (team: TeamIndex | null) => void;
}) {
  const ambiguous = event.candidates.length > 1;
  const team = event.candidates[0];
  const limit = event.type === 'bergpreis' ? BERGPREIS_POINTS : SIEG_POINTS;
  const value = CHRITZ_VALUE[event.type];

  let text: string;
  if (ambiguous) {
    text = `Beide Teams haben in dieser Runde ${limit} Punkte überschritten. Wer war zuerst?`;
  } else if (event.type === 'match') {
    text = `${names[team]} haben einen Match gemacht.`;
  } else if (event.type === 'bergpreis') {
    text = `${names[team]} haben als Erste ${BERGPREIS_POINTS} Punkte erreicht.`;
  } else {
    text = `${names[team]} haben als Erste ${SIEG_POINTS} Punkte erreicht und gewinnen die Partie.`;
  }

  return (
    <Modal>
      <div className="text-center">
        <div className="text-5xl mb-3">{CHRITZ_ICONS[event.type]}</div>
        <p className="text-2xl font-bold text-ink">{CHRITZ_LABELS[event.type]}!</p>
        <p className="text-ink-2 mt-2">{text}</p>
        <p className="text-sm text-gold font-semibold mt-3">
          {value === 1 ? '1 Chritz' : `${value} Chritz`}
          {!ambiguous && ` für ${names[team]}`}
        </p>
      </div>

      {ambiguous ? (
        <div className="space-y-2 mt-6">
          {([0, 1] as TeamIndex[]).map((t) => (
            <button
              key={t}
              onClick={() => onResolve(t)}
              className={`w-full rounded-2xl py-3.5 font-semibold transition ${TEAM_BTN[t]}`}
            >
              {names[t]}
            </button>
          ))}
          <Button variant="ghost" className="w-full" onClick={() => onResolve(null)}>
            Keinen Chritz eintragen
          </Button>
        </div>
      ) : (
        <div className="flex gap-3 mt-6">
          <Button className="flex-1" onClick={() => onResolve(null)}>
            Nein
          </Button>
          <Button variant="gold" className="flex-[1.6]" onClick={() => onResolve(team)}>
            <TeamDot team={team} className="ring-2 ring-black/20" /> Eintragen
          </Button>
        </div>
      )}
    </Modal>
  );
}

export function GameWonModal({
  gameNumber,
  name,
  onNewGame,
  onEndEvening,
  onClose,
}: {
  gameNumber: number;
  name: string;
  onNewGame: () => void;
  onEndEvening: () => void;
  onClose: () => void;
}) {
  return (
    <Modal onClose={onClose}>
      <div className="text-center">
        <div className="text-5xl mb-3">🏆</div>
        <p className="text-sm font-semibold text-ink-3 uppercase tracking-wider">Partie {gameNumber}</p>
        <p className="text-2xl font-bold text-ink mt-1">{name} gewinnen!</p>
        <p className="text-ink-2 mt-2">Wie geht&apos;s weiter?</p>
      </div>
      <div className="space-y-2 mt-6">
        <Button variant="primary" size="lg" className="w-full" onClick={onNewGame}>
          Neue Partie starten
        </Button>
        <Button className="w-full" onClick={onEndEvening}>
          Abend beenden
        </Button>
        <Button variant="ghost" className="w-full" onClick={onClose}>
          Später
        </Button>
      </div>
    </Modal>
  );
}

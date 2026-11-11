import { useState } from 'react';
import { CloudUpload, TriangleAlert } from 'lucide-react';
import { useApp } from '../data/store';
import { Button, ConfirmModal } from './ui';

/** Hinweis, wenn lokale Daten noch nicht in der Cloud sind oder die Verbindung fehlschlägt. */
export function CloudBanner() {
  const { sync, engine } = useApp();
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);

  if (sync.cloud && sync.status === 'error' && sync.error) {
    return (
      <div className="rounded-2xl border border-danger/40 bg-danger/10 p-4 flex gap-3">
        <TriangleAlert className="text-danger flex-shrink-0" size={20} />
        <div className="text-sm">
          <p className="font-semibold text-ink">Cloud-Speicherung fehlgeschlagen</p>
          <p className="text-ink-2 mt-0.5">{sync.error}</p>
          <p className="text-ink-3 mt-1">Deine Eingaben bleiben auf diesem Gerät gespeichert.</p>
        </div>
      </div>
    );
  }
  if (!sync.needsUpload) return null;
  return (
    <div className="rounded-2xl border border-brand/40 bg-brand/10 p-4">
      <div className="flex gap-3">
        <CloudUpload className="text-brand flex-shrink-0" size={20} />
        <div className="text-sm">
          <p className="font-semibold text-ink">Daten in die Cloud übernehmen?</p>
          <p className="text-ink-2 mt-0.5">
            Auf diesem Gerät sind Jass-Daten gespeichert, die noch nicht in der gemeinsamen Datenbank sind.
          </p>
        </div>
      </div>
      <div className="flex gap-2 mt-3">
        <Button
          variant="primary"
          size="sm"
          className="flex-1"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            await engine.uploadLocal();
            setBusy(false);
          }}
        >
          Hochladen
        </Button>
        <Button size="sm" className="flex-1" disabled={busy} onClick={() => setConfirm(true)}>
          Cloud verwenden
        </Button>
      </div>
      {confirm && (
        <ConfirmModal
          title="Cloud-Daten verwenden?"
          text="Die Daten auf diesem Gerät werden durch die Cloud-Daten ersetzt. Exportiere sie vorher unter «Spieler → Daten», falls du sie behalten willst."
          confirmLabel="Cloud verwenden"
          onCancel={() => setConfirm(false)}
          onConfirm={() => {
            setConfirm(false);
            void engine.useCloud();
          }}
        />
      )}
    </div>
  );
}

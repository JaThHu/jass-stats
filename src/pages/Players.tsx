import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, ChevronRight, Download, Pencil, Trash2, Upload, UserPlus, Users, X } from 'lucide-react';
import { useApp } from '../data/store';
import { addPlayer, deletePlayer, mergeData, playerHasEvenings, renamePlayer } from '../lib/actions';
import { parseImport, readLegacyLocal } from '../lib/legacy';
import { playerStats } from '../lib/stats';
import type { AppData } from '../lib/types';
import { Avatar, Button, Card, Chip, ConfirmModal, Empty, Label, PageHeader } from '../components/ui';
import { resolveMe, setMe } from '../lib/me';
import { SyncBadge } from '../components/SyncBadge';
import { CloudBanner } from '../components/CloudBanner';

export default function Players() {
  const { data, commit } = useApp();
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const stats = new Map(playerStats(data).map((s) => [s.playerId, s]));
  const players = [...data.players].sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  const add = () => {
    const name = newName.trim();
    if (!name) return;
    if (data.players.some((p) => p.name.toLowerCase() === name.toLowerCase())) {
      setError('Diesen Namen gibt es schon.');
      return;
    }
    commit((d) => addPlayer(d, name));
    setNewName('');
    setError('');
  };

  const saveName = (id: string) => {
    if (editName.trim()) commit((d) => renamePlayer(d, id, editName));
    setEditingId(null);
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Spieler" subtitle={`${players.length} Spieler`} />

      <Card className="p-4">
        <Label className="mb-2">Neuer Spieler</Label>
        <div className="flex gap-2">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && add()}
            placeholder="Name"
            className="flex-1 min-w-0 bg-surface-2 border border-line rounded-xl px-4 py-3 text-base text-ink placeholder:text-ink-3 outline-none focus:border-brand/60"
          />
          <Button variant="primary" onClick={add} disabled={!newName.trim()} aria-label="Spieler hinzufügen">
            <UserPlus size={18} />
          </Button>
        </div>
        {error && <p className="text-sm text-danger mt-2">{error}</p>}
        {players.length > 4 && (
          <p className="text-xs text-ink-3 mt-2">Die Rotation verwendet die ersten vier Spieler (nach Erfassung).</p>
        )}
      </Card>

      {players.length === 0 ? (
        <Card>
          <Empty icon={<Users size={24} />} title="Noch keine Spieler" text="Erfasse die vier Spieler eurer Jassrunde." />
        </Card>
      ) : (
        <Card className="divide-y divide-line overflow-hidden">
          {players.map((p) => {
            const s = stats.get(p.id);
            if (editingId === p.id) {
              return (
                <div key={p.id} className="flex gap-2 px-4 py-3">
                  <input
                    autoFocus
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveName(p.id);
                      if (e.key === 'Escape') setEditingId(null);
                    }}
                    className="flex-1 min-w-0 bg-surface-2 border border-line rounded-xl px-3 py-2 text-base text-ink outline-none focus:border-brand/60"
                  />
                  <Button size="sm" variant="primary" onClick={() => saveName(p.id)} aria-label="Speichern">
                    <Check size={16} />
                  </Button>
                  <Button size="sm" onClick={() => setEditingId(null)} aria-label="Abbrechen">
                    <X size={16} />
                  </Button>
                </div>
              );
            }
            return (
              <div key={p.id} className="flex items-center gap-3 px-4 py-3">
                <Link to={`/spieler/${p.id}`} className="flex items-center gap-3 flex-1 min-w-0 active:opacity-70">
                  <Avatar name={p.name} size={38} />
                  <div className="min-w-0">
                    <p className="font-semibold text-ink truncate">{p.name}</p>
                    <p className="text-xs text-ink-3">
                      {s?.evenings ?? 0} Abende · {s?.chritz ?? 0} Chritz
                    </p>
                  </div>
                  <ChevronRight size={16} className="text-ink-3 ml-auto flex-shrink-0" />
                </Link>
                <button
                  onClick={() => {
                    setEditingId(p.id);
                    setEditName(p.name);
                  }}
                  aria-label="Umbenennen"
                  className="p-2 rounded-lg text-ink-3 active:text-ink active:bg-surface-2"
                >
                  <Pencil size={16} />
                </button>
                {!playerHasEvenings(data, p.id) && (
                  <button
                    onClick={() => setDeleteId(p.id)}
                    aria-label="Löschen"
                    className="p-2 rounded-lg text-danger/80 active:bg-danger/10"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            );
          })}
        </Card>
      )}

      {players.length > 0 && <DeviceSection />}

      <DataSection />

      {deleteId && (
        <ConfirmModal
          title="Spieler löschen?"
          confirmLabel="Löschen"
          danger
          onCancel={() => setDeleteId(null)}
          onConfirm={() => {
            commit((d) => deletePlayer(d, deleteId));
            setDeleteId(null);
          }}
        />
      )}
    </div>
  );
}

function DeviceSection() {
  const { data } = useApp();
  const [me, setMeState] = useState(() => resolveMe(data));
  const players = [...data.players].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  return (
    <Card className="p-4">
      <Label className="mb-1">Dieses Gerät</Label>
      <p className="text-sm text-ink-2 mb-3">Wer schreibt auf diesem Handy? Sein Team steht auf der Tafel unten.</p>
      <div className="flex flex-wrap gap-2">
        {players.map((p) => (
          <Chip
            key={p.id}
            active={me === p.id}
            onClick={() => {
              setMe(p.id);
              setMeState(p.id);
            }}
          >
            {p.name}
          </Chip>
        ))}
      </div>
    </Card>
  );
}

function exportJson(data: AppData) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `jass-stats-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function DataSection() {
  const { data, sync, commit } = useApp();
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<{ data: AppData; label: string } | null>(null);
  const [msg, setMsg] = useState('');
  const legacy = readLegacyLocal();

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const parsed = parseImport(JSON.parse(await file.text()));
      setPending({ data: parsed, label: file.name });
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Datei konnte nicht gelesen werden');
    }
  };

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-ink">Daten</h2>
        <SyncBadge sync={sync} />
      </div>
      <CloudBanner />
      <Card className="p-4 space-y-3">
        <p className="text-sm text-ink-2">
          {sync.cloud
            ? 'Die Daten liegen in der gemeinsamen Supabase-Datenbank und sind auf allen Handys live gleich. Ohne Netz wird lokal gespeichert und später synchronisiert.'
            : 'Die Daten liegen nur auf diesem Gerät. Für die gemeinsame Datenbank muss Supabase eingerichtet werden (siehe README).'}
        </p>
        <div className="flex gap-2">
          <Button size="sm" className="flex-1" onClick={() => exportJson(data)}>
            <Download size={16} /> Exportieren
          </Button>
          <Button size="sm" className="flex-1" onClick={() => fileRef.current?.click()}>
            <Upload size={16} /> Importieren
          </Button>
          <input ref={fileRef} type="file" accept=".json,application/json" className="hidden" onChange={onFile} />
        </div>
        {legacy && legacy.evenings.length > 0 && sync.cloud && !sync.needsUpload && (
          <button
            onClick={() => setPending({ data: legacy, label: 'Daten der alten App-Version auf diesem Gerät' })}
            className="text-sm font-semibold text-brand"
          >
            Alte Daten dieses Geräts übernehmen ({legacy.evenings.length} Abende)
          </button>
        )}
        {msg && <p className="text-sm text-ink-2">{msg}</p>}
      </Card>

      {pending && (
        <ConfirmModal
          title="Daten importieren?"
          text={`${pending.label}: ${pending.data.players.length} Spieler, ${pending.data.evenings.length} Abende. Bestehende Einträge mit gleicher ID werden überschrieben, alle anderen bleiben erhalten.`}
          confirmLabel="Importieren"
          onCancel={() => setPending(null)}
          onConfirm={() => {
            const incoming = pending.data;
            commit((d) => mergeData(d, incoming));
            setPending(null);
            setMsg(`Import abgeschlossen: ${incoming.evenings.length} Abende.`);
          }}
        />
      )}
    </section>
  );
}

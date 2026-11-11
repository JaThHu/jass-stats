import { Cloud, CloudOff, HardDrive, Loader2, TriangleAlert } from 'lucide-react';
import type { SyncState } from '../data/sync';
import { cx } from '../lib/cx';

export function SyncBadge({ sync, className }: { sync: SyncState; className?: string }) {
  let icon = <HardDrive size={13} />;
  let label = 'Lokal';
  let tone = 'text-ink-3 border-line';
  if (sync.cloud) {
    if (sync.status === 'connecting' || (sync.status === 'online' && sync.pending > 0)) {
      icon = <Loader2 size={13} className="animate-spin" />;
      label = sync.status === 'connecting' ? 'Verbinde' : 'Speichere';
      tone = 'text-ink-2 border-line';
    } else if (sync.status === 'online') {
      icon = <Cloud size={13} />;
      label = 'Live';
      tone = 'text-brand border-brand/30';
    } else if (sync.status === 'offline') {
      icon = <CloudOff size={13} />;
      label = sync.pending ? `Offline · ${sync.pending}` : 'Offline';
      tone = 'text-gold border-gold/30';
    } else if (sync.status === 'error') {
      icon = <TriangleAlert size={13} />;
      label = 'Fehler';
      tone = 'text-danger border-danger/40';
    }
  }
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border bg-surface',
        tone,
        className,
      )}
      title={sync.error ?? undefined}
    >
      {icon}
      {label}
    </span>
  );
}

import { createClient, type RealtimeChannel, type SupabaseClient } from '@supabase/supabase-js';
import { readLegacyLocal } from '../lib/legacy';
import { EMPTY_DATA, TABLES, type AppData, type TableName } from '../lib/types';
import { fromRow, toRow, type Row } from './mapping';

export type SyncStatus = 'local' | 'connecting' | 'online' | 'offline' | 'error';

export interface SyncState {
  cloud: boolean;
  status: SyncStatus;
  pending: number;
  error: string | null;
  /** Lokale Daten, die (noch) nicht in der Cloud sind – Nutzer muss entscheiden. */
  needsUpload: boolean;
  lastSync: string | null;
}

export interface Snapshot {
  data: AppData;
  sync: SyncState;
}

interface Op {
  table: TableName;
  id: string;
  kind: 'upsert' | 'delete';
  row?: Row;
}

type Entity = { id: string };

const CACHE_KEY = 'jass-stats-v2';
const OUTBOX_KEY = 'jass-stats-outbox';

/** Fehler, bei denen ein erneuter Versuch nichts bringt (Datenkonflikt) → Operation verwerfen. */
const DATA_CONFLICT = new Set(['23503', '23505', '23514', '22P02', '23502', '21000']);

const rows = (d: AppData, t: TableName) => d[t] as Entity[];

export function supabaseConfig(): { url: string; key: string } | null {
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const key = (import.meta.env.VITE_SUPABASE_ANON_KEY ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY) as
    | string
    | undefined;
  return url && key ? { url, key } : null;
}

/** Unterschiede zwischen zwei Ständen als Upsert/Delete-Operationen. */
export function diff(prev: AppData, next: AppData): Op[] {
  const ups: Op[] = [];
  const dels: Op[] = [];
  for (const t of TABLES) {
    if (prev[t] === next[t]) continue;
    const before = new Map(rows(prev, t).map((x) => [x.id, x]));
    const after = new Set<string>();
    for (const x of rows(next, t)) {
      after.add(x.id);
      if (before.get(x.id) !== x) ups.push({ table: t, id: x.id, kind: 'upsert', row: toRow(t, x as never) });
    }
    for (const x of rows(prev, t)) if (!after.has(x.id)) dels.push({ table: t, id: x.id, kind: 'delete' });
  }
  // Löschen von "Kindern" zuerst (chritz → rounds → games → evenings), dann einfügen in Eltern-Reihenfolge.
  return [...dels.reverse(), ...ups];
}

function applyOps(base: AppData, ops: Op[]): AppData {
  if (ops.length === 0) return base;
  const out = { ...base } as Record<TableName, Entity[]>;
  for (const op of ops) {
    const list = out[op.table].filter((x) => x.id !== op.id);
    if (op.kind === 'upsert' && op.row) list.push(fromRow(op.table, op.row));
    out[op.table] = list;
  }
  return out as unknown as AppData;
}

interface Cache {
  version: 2;
  origin: 'local' | 'cloud';
  data: AppData;
}

function readCache(): Cache | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const c = JSON.parse(raw) as Cache;
    if (c?.version !== 2 || !c.data) return null;
    for (const t of TABLES) if (!Array.isArray(c.data[t])) c.data[t] = [];
    return c;
  } catch {
    return null;
  }
}

function writeCache(c: Cache) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(c));
  } catch {
    /* Speicher voll – Cloud bleibt die Quelle */
  }
}

function readOutbox(): Op[] {
  try {
    const raw = localStorage.getItem(OUTBOX_KEY);
    return raw ? (JSON.parse(raw) as Op[]) : [];
  } catch {
    return [];
  }
}

function errMessage(e: unknown): string {
  if (e && typeof e === 'object' && 'message' in e) return String((e as { message: unknown }).message);
  return String(e);
}

function isNetworkError(e: unknown): boolean {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return true;
  const code = e && typeof e === 'object' && 'code' in e ? String((e as { code: unknown }).code ?? '') : '';
  return code === '' || /fetch|network|load failed/i.test(errMessage(e));
}

function friendlyError(e: unknown): string {
  const code = e && typeof e === 'object' && 'code' in e ? String((e as { code: unknown }).code) : '';
  if (code === 'PGRST205' || code === '42P01') {
    return 'Die Tabellen fehlen in Supabase. Bitte das SQL aus supabase/schema.sql ausführen.';
  }
  if (code === '42501') return 'Keine Berechtigung. Bitte die Policies aus supabase/schema.sql ausführen.';
  return errMessage(e);
}

export class SyncEngine {
  private snapshot: Snapshot;
  private listeners = new Set<() => void>();
  private client: SupabaseClient | null = null;
  private channel: RealtimeChannel | null = null;
  private outbox: Op[] = [];
  private inflight = 0;
  private flushing = false;
  private origin: Cache['origin'] = 'local';
  private subscribedOnce = false;
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    const cfg = supabaseConfig();
    const cache = readCache();
    let data = cache?.data ?? null;
    this.origin = cache?.origin ?? 'local';
    if (!data) {
      data = readLegacyLocal() ?? EMPTY_DATA;
      this.origin = 'local';
    }
    if (cfg) {
      this.client = createClient(cfg.url, cfg.key, { auth: { persistSession: false } });
      this.outbox = readOutbox();
    }
    this.snapshot = {
      data,
      sync: {
        cloud: !!cfg,
        status: cfg ? 'connecting' : 'local',
        pending: this.outbox.length,
        error: null,
        needsUpload: false,
        lastSync: null,
      },
    };
  }

  // ───────── useSyncExternalStore ─────────
  subscribe = (cb: () => void) => {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  };
  getSnapshot = () => this.snapshot;

  private emit(patch: { data?: AppData; sync?: Partial<SyncState> }) {
    this.snapshot = {
      data: patch.data ?? this.snapshot.data,
      sync: { ...this.snapshot.sync, ...patch.sync, pending: this.outbox.length },
    };
    if (patch.data) writeCache({ version: 2, origin: this.origin, data: this.snapshot.data });
    this.listeners.forEach((l) => l());
  }

  get data() {
    return this.snapshot.data;
  }

  // ───────── Lebenszyklus ─────────
  start() {
    if (!this.client) return () => {};
    this.channel = this.client
      .channel(`jass-stats-db-${Math.random().toString(36).slice(2, 8)}`)
      .on('postgres_changes', { event: '*', schema: 'public' }, (payload) => this.onRemote(payload))
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          if (this.subscribedOnce) void this.refresh();
          this.subscribedOnce = true;
        }
      });
    void this.refresh();

    const onVisible = () => {
      if (document.visibilityState === 'visible') void this.refresh();
    };
    const onOnline = () => void this.refresh();
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('online', onOnline);
    this.timer = setInterval(() => {
      if (this.outbox.length) void this.flush();
    }, 15000);

    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('online', onOnline);
      if (this.timer) clearInterval(this.timer);
      if (this.channel) void this.client?.removeChannel(this.channel);
      this.channel = null;
      this.subscribedOnce = false;
    };
  }

  // ───────── Lokale Änderungen ─────────
  commit(fn: (d: AppData) => AppData) {
    const prev = this.snapshot.data;
    const next = fn(prev);
    if (next === prev) return;
    const ops = diff(prev, next);
    if (this.client && !this.snapshot.sync.needsUpload) {
      this.enqueue(ops);
      this.emit({ data: next });
      void this.flush();
    } else {
      this.emit({ data: next });
    }
  }

  private enqueue(ops: Op[]) {
    for (const op of ops) {
      const idx = this.outbox.findIndex((o, i) => i >= this.inflight && o.table === op.table && o.id === op.id);
      if (idx >= 0) this.outbox[idx] = op;
      else this.outbox.push(op);
    }
    this.saveOutbox();
  }

  private saveOutbox() {
    try {
      localStorage.setItem(OUTBOX_KEY, JSON.stringify(this.outbox));
    } catch {
      /* ignore */
    }
  }

  // ───────── Cloud ─────────
  private async flush() {
    const client = this.client;
    if (!client || this.flushing || this.snapshot.sync.needsUpload) return;
    if (!this.outbox.length) return;
    this.flushing = true;
    let size = 500;
    try {
      while (this.outbox.length) {
        const first = this.outbox[0];
        let n = 1;
        while (
          n < this.outbox.length &&
          n < size &&
          this.outbox[n].table === first.table &&
          this.outbox[n].kind === first.kind
        )
          n++;
        const batch = this.outbox.slice(0, n);
        this.inflight = n;
        const q = client.from(first.table);
        const { error } =
          first.kind === 'upsert'
            ? await q.upsert(batch.map((o) => o.row!))
            : await q.delete().in('id', batch.map((o) => o.id));
        this.inflight = 0;

        if (error) {
          if (isNetworkError(error)) {
            this.emit({ sync: { status: 'offline' } });
            return;
          }
          if (DATA_CONFLICT.has(error.code)) {
            if (n > 1) {
              size = 1; // einzeln wiederholen, um die fehlerhafte Operation zu finden
              continue;
            }
            console.warn('Operation verworfen', first, error);
            this.outbox.splice(0, 1);
            this.saveOutbox();
            continue;
          }
          this.emit({ sync: { status: 'error', error: friendlyError(error) } });
          return;
        }
        this.outbox.splice(0, n);
        this.saveOutbox();
      }
      this.emit({ sync: { status: 'online', error: null, lastSync: new Date().toISOString() } });
    } finally {
      this.inflight = 0;
      this.flushing = false;
    }
  }

  private async fetchAll(): Promise<AppData> {
    const client = this.client!;
    const result = await Promise.all(
      TABLES.map(async (t) => {
        const all: Row[] = [];
        for (let from = 0; ; from += 1000) {
          const { data, error } = await client
            .from(t)
            .select('*')
            .order('id')
            .range(from, from + 999);
          if (error) throw error;
          all.push(...(data as Row[]));
          if (data.length < 1000) break;
        }
        return [t, all.map((r) => fromRow(t, r))] as const;
      }),
    );
    return Object.fromEntries(result) as unknown as AppData;
  }

  async refresh() {
    if (!this.client) return;
    try {
      await this.flush();
      const remote = await this.fetchAll();
      const remoteEmpty = TABLES.every((t) => remote[t].length === 0);
      const localHas = TABLES.some((t) => this.data[t].length > 0);
      if (localHas && this.origin === 'local' && this.outbox.length === 0) {
        // Daten aus der Zeit vor der Cloud: Nutzer entscheidet, ob sie hochgeladen werden.
        this.emit({ sync: { status: 'online', error: null, needsUpload: true } });
        return;
      }
      if (remoteEmpty && localHas && this.outbox.length === 0 && this.origin === 'cloud') {
        // Cloud wurde geleert – lokale Kopie behalten und Hochladen anbieten.
        this.origin = 'local';
        this.emit({ sync: { status: 'online', error: null, needsUpload: true } });
        return;
      }
      this.origin = 'cloud';
      this.emit({
        data: applyOps(remote, this.outbox),
        sync: { status: 'online', error: null, needsUpload: false, lastSync: new Date().toISOString() },
      });
      void this.flush();
    } catch (e) {
      if (isNetworkError(e)) this.emit({ sync: { status: 'offline' } });
      else this.emit({ sync: { status: 'error', error: friendlyError(e) } });
    }
  }

  /** Lädt alle lokalen Daten in die Cloud (zusammenführen per ID). */
  async uploadLocal() {
    if (!this.client) return;
    const empty = EMPTY_DATA;
    this.origin = 'cloud';
    this.snapshot = { ...this.snapshot, sync: { ...this.snapshot.sync, needsUpload: false } };
    this.enqueue(diff(empty, this.data));
    this.emit({ data: this.data, sync: { status: 'connecting' } });
    await this.flush();
    await this.refresh();
  }

  /** Verwirft die lokale Kopie und übernimmt den Cloud-Stand. */
  async useCloud() {
    if (!this.client) return;
    this.origin = 'cloud';
    this.outbox = [];
    this.saveOutbox();
    this.emit({ sync: { needsUpload: false, status: 'connecting' } });
    await this.refresh();
  }

  private onRemote(payload: {
    table: string;
    eventType: 'INSERT' | 'UPDATE' | 'DELETE';
    new: Record<string, unknown>;
    old: Record<string, unknown>;
  }) {
    if (this.snapshot.sync.needsUpload) return;
    const table = payload.table as TableName;
    if (!TABLES.includes(table)) return;
    const id = String((payload.eventType === 'DELETE' ? payload.old?.id : payload.new?.id) ?? '');
    if (!id) return;
    // Eigene, noch nicht bestätigte Änderungen haben Vorrang.
    if (this.outbox.some((o) => o.table === table && o.id === id)) return;
    const op: Op =
      payload.eventType === 'DELETE' ? { table, id, kind: 'delete' } : { table, id, kind: 'upsert', row: payload.new };
    this.emit({ data: applyOps(this.data, [op]), sync: { lastSync: new Date().toISOString() } });
  }
}

import { useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from 'react';
import { AppContext } from './store';
import { SyncEngine } from './sync';

export function AppProvider({ children }: { children: ReactNode }) {
  const [engine] = useState(() => new SyncEngine());
  const snap = useSyncExternalStore(engine.subscribe, engine.getSnapshot);

  useEffect(() => engine.start(), [engine]);

  const value = useMemo(
    () => ({ data: snap.data, sync: snap.sync, commit: engine.commit.bind(engine), engine }),
    [snap, engine],
  );
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

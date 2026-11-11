import { createContext, useContext } from 'react';
import type { AppData } from '../lib/types';
import type { SyncEngine, SyncState } from './sync';

export interface AppContextValue {
  data: AppData;
  sync: SyncState;
  commit: (fn: (d: AppData) => AppData) => void;
  engine: SyncEngine;
}

export const AppContext = createContext<AppContextValue | null>(null);

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}

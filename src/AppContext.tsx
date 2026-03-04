import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { AppData } from './types';
import { loadData, saveData } from './store';

interface AppContextType {
  data: AppData;
  setData: (data: AppData) => void;
  update: (newData: AppData) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [data, setDataState] = useState<AppData>(() => loadData());

  const update = useCallback((newData: AppData) => {
    saveData(newData);
    setDataState(newData);
  }, []);

  return (
    <AppContext.Provider value={{ data, setData: setDataState, update }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}

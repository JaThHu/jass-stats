import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppProvider } from './data/AppProvider';
import Layout from './Layout';
import Home from './pages/Home';
import Tafel from './pages/Tafel';
import Evenings from './pages/Evenings';
import EveningDetail from './pages/EveningDetail';
import EveningNew from './pages/EveningNew';
import Stats from './pages/Stats';
import Players from './pages/Players';
import PlayerDetail from './pages/PlayerDetail';

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/tafel" element={<Tafel />} />
            <Route path="/abende" element={<Evenings />} />
            <Route path="/abende/neu" element={<EveningNew />} />
            <Route path="/abende/:id" element={<EveningDetail />} />
            <Route path="/statistik" element={<Stats />} />
            <Route path="/spieler" element={<Players />} />
            <Route path="/spieler/:id" element={<PlayerDetail />} />
            <Route path="/rotation" element={<Navigate to="/" replace />} />
            <Route path="/neuer-abend" element={<Navigate to="/" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './AppContext';
import Layout from './Layout';
import Dashboard from './pages/Dashboard';
import NewSession from './pages/NewSession';
import Sessions from './pages/Sessions';
import Players from './pages/Players';
import PlayerDetail from './pages/PlayerDetail';
import Rotation from './pages/Rotation';

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/neuer-abend" element={<NewSession />} />
            <Route path="/abende" element={<Sessions />} />
            <Route path="/spieler" element={<Players />} />
            <Route path="/spieler/:id" element={<PlayerDetail />} />
            <Route path="/rotation" element={<Rotation />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}

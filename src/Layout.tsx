import { NavLink, Outlet } from 'react-router-dom';

const navItems = [
  { to: '/', label: 'Rangliste', short: 'Rang', icon: '📊' },
  { to: '/neuer-abend', label: 'Neuer Abend', short: 'Neu', icon: '➕' },
  { to: '/abende', label: 'Abende', short: 'Abende', icon: '📅' },
  { to: '/spieler', label: 'Spieler', short: 'Spieler', icon: '👥' },
  { to: '/rotation', label: 'Rotation', short: 'Rotation', icon: '🔄' },
];

export default function Layout() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header — padding-top for iOS status bar */}
      <header className="bg-green-700 text-white shadow-md pt-safe">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <span className="text-2xl">🃏</span>
          <h1 className="text-xl font-bold tracking-tight">Jass-Stats</h1>
        </div>
      </header>

      {/* Main content — extra bottom padding so content isn't hidden behind nav */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-6 pb-24">
        <Outlet />
      </main>

      {/* Bottom nav — safe-area bottom padding for iOS home indicator */}
      <nav className="fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 shadow-lg pb-safe z-50">
        <div className="max-w-4xl mx-auto flex">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center py-2 px-1 min-h-[56px] justify-center text-xs font-medium transition-colors ${
                  isActive
                    ? 'text-green-700 border-t-2 border-green-700'
                    : 'text-gray-500 hover:text-green-600'
                }`
              }
            >
              <span className="text-xl leading-none mb-0.5">{item.icon}</span>
              <span className="hidden xs:inline">{item.label}</span>
              <span className="xs:hidden">{item.short}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}

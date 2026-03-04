import { NavLink, Outlet } from 'react-router-dom';

const navItems = [
  { to: '/', label: 'Dashboard', icon: '📊' },
  { to: '/neuer-abend', label: 'Neuer Abend', icon: '➕' },
  { to: '/abende', label: 'Abende', icon: '📅' },
  { to: '/spieler', label: 'Spieler', icon: '👥' },
  { to: '/rotation', label: 'Rotation', icon: '🔄' },
];

export default function Layout() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-green-700 text-white shadow-md">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <span className="text-2xl">🃏</span>
          <h1 className="text-xl font-bold tracking-tight">Jass-Stats</h1>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-6">
        <Outlet />
      </main>

      {/* Bottom nav (mobile-friendly) */}
      <nav className="sticky bottom-0 bg-white border-t border-gray-200 shadow-lg">
        <div className="max-w-4xl mx-auto flex">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center py-2 px-1 text-xs font-medium transition-colors ${
                  isActive
                    ? 'text-green-700 border-t-2 border-green-700'
                    : 'text-gray-500 hover:text-green-600'
                }`
              }
            >
              <span className="text-lg leading-none mb-0.5">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}

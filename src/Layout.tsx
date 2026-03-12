import { NavLink, Outlet } from 'react-router-dom';

const navItems = [
  { to: '/', label: 'Rangliste', icon: '📊' },
  { to: '/neuer-abend', label: 'Neu', icon: '➕' },
  { to: '/abende', label: 'Abende', icon: '📅' },
  { to: '/spieler', label: 'Spieler', icon: '👥' },
  { to: '/rotation', label: 'Rotation', icon: '🔄' },
  { to: '/tafel', label: 'Tafel', icon: '📋' },
];

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col">


      {/* Main content */}
      <main className="flex-1 max-w-xl mx-auto w-full px-4 py-5 pb-28">
        <Outlet />
      </main>

      {/* Bottom nav — iOS frosted glass style */}
      <nav className="fixed bottom-0 inset-x-0 bg-white/85 backdrop-blur-xl border-t border-black/[0.08] pb-safe z-50">
        <div className="max-w-xl mx-auto flex">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center pt-2.5 pb-2 gap-0.5 transition-colors ${
                  isActive ? 'text-green-700' : 'text-gray-400'
                }`
              }
            >
              <span className="text-2xl leading-none">{item.icon}</span>
              <span className="text-[10px] font-medium leading-tight">{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}

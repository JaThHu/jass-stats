import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { BarChart3, CalendarDays, Trophy, Users, Grid2x2 } from 'lucide-react';
import { useEffect } from 'react';
import { useApp } from './data/store';
import { activeEvening } from './lib/actions';
import { cx } from './lib/cx';

const navItems = [
  { to: '/', label: 'Rangliste', icon: Trophy },
  { to: '/tafel', label: 'Tafel', icon: Grid2x2 },
  { to: '/abende', label: 'Abende', icon: CalendarDays },
  { to: '/statistik', label: 'Statistik', icon: BarChart3 },
  { to: '/spieler', label: 'Spieler', icon: Users },
];

export default function Layout() {
  const { data } = useApp();
  const live = !!activeEvening(data);
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="min-h-[100dvh] flex flex-col">
      <main className="flex-1 max-w-xl mx-auto w-full px-4 pt-safe pb-28">
        <div className="pt-3">
          <Outlet />
        </div>
      </main>

      <nav className="fixed bottom-0 inset-x-0 bg-bg/85 backdrop-blur-xl border-t border-line pb-safe z-50">
        <div className="max-w-xl mx-auto flex">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                cx(
                  'flex-1 flex flex-col items-center pt-2.5 pb-1.5 gap-1 transition-colors relative',
                  isActive ? 'text-brand' : 'text-ink-3 active:text-ink-2',
                )
              }
            >
              <span className="relative">
                <Icon size={23} strokeWidth={2} />
                {to === '/tafel' && live && (
                  <span className="absolute -top-0.5 -right-1 w-2.5 h-2.5 rounded-full bg-danger border-2 border-bg" />
                )}
              </span>
              <span className="text-[10.5px] font-semibold leading-tight">{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}

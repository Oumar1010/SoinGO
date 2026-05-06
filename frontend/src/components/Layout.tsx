import { Link, useLocation } from 'react-router-dom';
import {
  HomeIcon,
  UserGroupIcon,
  CalendarIcon,
  MapIcon,
  UsersIcon,
  ArrowRightOnRectangleIcon,
  CalendarDaysIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeIconSolid,
  UserGroupIcon as UserGroupIconSolid,
  CalendarIcon as CalendarIconSolid,
  MapIcon as MapIconSolid,
  UsersIcon as UsersIconSolid,
  CalendarDaysIcon as CalendarDaysIconSolid,
} from '@heroicons/react/24/solid';
import { useAuth } from '../contexts/AuthContext';

const ROLE_LABELS: Record<string, string> = {
  ADMIN:         'Administrateur',
  COORDO:        'Coordinateur',
  AIDE_SOIGNANT: 'Aide-soignant',
};

const ROLE_COLORS: Record<string, string> = {
  ADMIN:         'bg-purple-100 text-purple-700',
  COORDO:        'bg-blue-100 text-primary',
  AIDE_SOIGNANT: 'bg-green-100 text-success',
};

const nav = [
  { to: '/dashboard', label: 'Tableau de bord', Icon: HomeIcon,          IconSolid: HomeIconSolid },
  { to: '/planning',  label: 'Planning mensuel', Icon: CalendarDaysIcon, IconSolid: CalendarDaysIconSolid },
  { to: '/visits',    label: 'Visites du jour',  Icon: CalendarIcon,     IconSolid: CalendarIconSolid },
  { to: '/patients',  label: 'Patients',         Icon: UserGroupIcon,    IconSolid: UserGroupIconSolid },
  { to: '/map',       label: 'Carte & Routes',   Icon: MapIcon,          IconSolid: MapIconSolid },
  { to: '/users',     label: 'Équipe',           Icon: UsersIcon,        IconSolid: UsersIconSolid },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();

  return (
    <div className="flex h-screen bg-neutral">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-sm flex flex-col border-r border-gray-100">

        {/* Logo */}
        <div className="px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
              <span className="text-white text-sm font-black">S</span>
            </div>
            <h1 className="text-xl font-black tracking-tight">
              <span className="text-primary">Soin</span>
              <span className="text-accent">Go</span>
            </h1>
          </div>

          {/* User info */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-blue-400 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {user?.nom?.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-800 truncate">{user?.nom}</p>
              {user?.role && (
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_COLORS[user.role] ?? 'bg-gray-100 text-gray-600'}`}>
                  {ROLE_LABELS[user.role] ?? user.role}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {nav.map(({ to, label, Icon, IconSolid }) => {
            const active = pathname === to || (to !== '/dashboard' && pathname.startsWith(to));
            const ActiveIcon = active ? IconSolid : Icon;
            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all text-sm group ${
                  active
                    ? 'bg-primary text-white shadow-sm shadow-primary/30'
                    : 'text-gray-600 hover:bg-neutral hover:text-gray-900'
                }`}
              >
                <ActiveIcon className="w-5 h-5 flex-shrink-0" />
                <span className="flex-1">{label}</span>
                {active && <ChevronRightIcon className="w-3.5 h-3.5 opacity-60" />}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-gray-100 space-y-1">
          <div className="px-3 py-2">
            <p className="text-xs text-gray-400">SoinGo v1.0 · <span className="text-success">Actif</span></p>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-3 px-3 py-2.5 text-gray-500 hover:text-red-500 w-full rounded-xl hover:bg-red-50 transition-all text-sm font-medium"
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5" />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}

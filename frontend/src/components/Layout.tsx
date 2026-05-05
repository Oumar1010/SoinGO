import { Link, useLocation } from 'react-router-dom';
import {
  HomeIcon,
  UserGroupIcon,
  CalendarIcon,
  MapIcon,
  UsersIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';

const nav = [
  { to: '/dashboard', label: 'Tableau de bord', Icon: HomeIcon },
  { to: '/visits',    label: 'Visites',          Icon: CalendarIcon },
  { to: '/patients',  label: 'Patients',         Icon: UserGroupIcon },
  { to: '/map',       label: 'Carte',            Icon: MapIcon },
  { to: '/users',     label: 'Équipe',           Icon: UsersIcon },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();

  return (
    <div className="flex h-screen bg-neutral">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-sm flex flex-col">
        <div className="p-6 border-b border-gray-100">
          <h1 className="text-2xl font-bold">
            <span className="text-primary">Soin</span>
            <span className="text-accent">Go</span>
          </h1>
          <p className="text-xs text-gray-500 mt-1">{user?.nom}</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {nav.map(({ to, label, Icon }) => (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
                pathname === to
                  ? 'bg-primary text-white'
                  : 'text-gray-600 hover:bg-neutral'
              }`}
            >
              <Icon className="w-5 h-5" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <button
            onClick={logout}
            className="flex items-center gap-3 px-4 py-3 text-gray-500 hover:text-red-500 w-full rounded-xl hover:bg-neutral transition-colors"
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5" />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto p-8">
        {children}
      </main>
    </div>
  );
}

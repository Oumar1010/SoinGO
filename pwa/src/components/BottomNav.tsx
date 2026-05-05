import { NavLink } from 'react-router-dom';
import { CalendarIcon, MapIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import { CalendarIcon as CalendarSolid, MapIcon as MapSolid, UserCircleIcon as UserSolid } from '@heroicons/react/24/solid';

const tabs = [
  { to: '/planning', label: 'Planning', Icon: CalendarIcon, ActiveIcon: CalendarSolid },
  { to: '/carte',    label: 'Carte',    Icon: MapIcon,      ActiveIcon: MapSolid },
  { to: '/profil',   label: 'Profil',   Icon: UserCircleIcon, ActiveIcon: UserSolid },
];

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex safe-area-inset-bottom shadow-lg">
      {tabs.map(({ to, label, Icon, ActiveIcon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `nav-tab ${isActive ? 'text-primary' : 'text-gray-400'}`
          }
        >
          {({ isActive }) =>
            isActive
              ? <><ActiveIcon className="w-7 h-7" /><span>{label}</span></>
              : <><Icon className="w-7 h-7" /><span>{label}</span></>
          }
        </NavLink>
      ))}
    </nav>
  );
}

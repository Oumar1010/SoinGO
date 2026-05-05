import { UserCircleIcon, ArrowRightOnRectangleIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Administrateur',
  COORDO: 'Coordinateur',
  AIDE_SOIGNANT: 'Aide-soignant',
};

export default function ProfilPage() {
  const { user, logout } = useAuth();

  return (
    <div className="p-5 space-y-5">
      <h2 className="text-2xl font-bold">Profil</h2>

      <div className="card flex items-center gap-5">
        <div className="bg-neutral rounded-full p-4">
          <UserCircleIcon className="w-14 h-14 text-primary" />
        </div>
        <div>
          <p className="text-xl font-bold">{user?.nom}</p>
          <p className="text-gray-500">{user?.email}</p>
          <div className="flex items-center gap-2 mt-1">
            <ShieldCheckIcon className="w-4 h-4 text-success" />
            <span className="text-sm text-success font-medium">
              {ROLE_LABELS[user?.role || ''] || user?.role}
            </span>
          </div>
        </div>
      </div>

      <div className="card space-y-3">
        <h3 className="font-semibold text-gray-600 text-sm uppercase tracking-wide">Application</h3>
        <div className="flex justify-between items-center py-2 border-b border-gray-50">
          <span className="text-gray-600">Version</span>
          <span className="text-gray-400 text-sm">0.1.0</span>
        </div>
        <div className="flex justify-between items-center py-2">
          <span className="text-gray-600">Mode</span>
          <span className="text-sm bg-blue-50 text-primary px-3 py-1 rounded-full font-medium">PWA iPad</span>
        </div>
      </div>

      <button
        onClick={logout}
        className="btn w-full bg-red-50 text-red-500 hover:bg-red-100"
      >
        <ArrowRightOnRectangleIcon className="w-6 h-6" />
        Déconnexion
      </button>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  UserGroupIcon,
  CalendarIcon,
  CheckCircleIcon,
  ClockIcon,
  ChevronRightIcon,
  BoltIcon,
} from '@heroicons/react/24/outline';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

export default function DashboardPage() {
  const { user } = useAuth();
  const today = new Date().toISOString().split('T')[0];

  const [visits, setVisits]         = useState<any[]>([]);
  const [totalPatients, setTotalPatients] = useState(0);
  const [totalUsers, setTotalUsers]       = useState(0);
  const [loading, setLoading]             = useState(true);

  useEffect(() => {
    Promise.all([
      api.get(`/visits?date=${today}`),
      api.get('/patients'),
      api.get('/users'),
    ]).then(([vRes, pRes, uRes]) => {
      setVisits(vRes.data);
      setTotalPatients(pRes.data.length);
      setTotalUsers(uRes.data.length);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [today]);

  const planifiees  = visits.filter(v => v.statut === 'PLANIFIE').length;
  const enCours     = visits.filter(v => v.statut === 'EN_COURS').length;
  const terminees   = visits.filter(v => v.statut === 'TERMINE').length;
  const progression = visits.length > 0 ? Math.round((terminees / visits.length) * 100) : 0;

  const statCards = [
    {
      label: 'Visites aujourd\'hui',
      value: visits.length,
      sub: `${terminees} terminée(s)`,
      Icon: CalendarIcon,
      color: 'text-primary',
      bg: 'bg-blue-50',
      to: '/visits',
    },
    {
      label: 'En cours',
      value: enCours,
      sub: `${planifiees} planifiée(s)`,
      Icon: ClockIcon,
      color: 'text-accent',
      bg: 'bg-orange-50',
      to: '/visits',
    },
    {
      label: 'Patients',
      value: totalPatients,
      sub: 'dans la base',
      Icon: UserGroupIcon,
      color: 'text-gray-500',
      bg: 'bg-neutral',
      to: '/patients',
    },
    {
      label: 'Équipe',
      value: totalUsers,
      sub: 'membres actifs',
      Icon: CheckCircleIcon,
      color: 'text-success',
      bg: 'bg-green-50',
      to: '/users',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800">
          Bonjour, {user?.nom?.split(' ')[0]} 👋
        </h2>
        <p className="text-gray-500">
          {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ label, value, sub, Icon, color, bg, to }) => (
          <Link key={label} to={to} className="card hover:shadow-md transition-shadow group">
            <div className={`${bg} ${color} w-12 h-12 rounded-2xl flex items-center justify-center mb-3`}>
              <Icon className="w-6 h-6" />
            </div>
            <p className="text-3xl font-bold text-gray-800">{loading ? '—' : value}</p>
            <p className="text-sm font-medium text-gray-600 mt-0.5">{label}</p>
            <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
          </Link>
        ))}
      </div>

      {/* Progression du jour */}
      {visits.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-700">Progression du jour</h3>
            <span className="text-2xl font-bold text-primary">{progression}%</span>
          </div>
          <div className="w-full bg-neutral rounded-full h-3">
            <div
              className="bg-primary h-3 rounded-full transition-all duration-500"
              style={{ width: `${progression}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-2">
            {terminees} / {visits.length} visites terminées
          </p>
        </div>
      )}

      {/* Visites du jour */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-700">Visites du jour</h3>
          <Link to="/visits" className="text-sm text-primary flex items-center gap-1 hover:underline">
            Tout voir <ChevronRightIcon className="w-4 h-4" />
          </Link>
        </div>

        {loading && (
          <div className="space-y-3">
            {[1,2,3].map(i => (
              <div key={i} className="h-16 bg-neutral rounded-xl animate-pulse" />
            ))}
          </div>
        )}

        {!loading && visits.length === 0 && (
          <div className="text-center py-10">
            <CalendarIcon className="w-12 h-12 text-gray-200 mx-auto mb-2" />
            <p className="text-gray-400 mb-3">Aucune visite planifiée aujourd'hui</p>
            <Link to="/visits" className="btn-primary inline-flex text-sm">
              <PlusIcon className="w-4 h-4" />
              Planifier une visite
            </Link>
          </div>
        )}

        <div className="space-y-2">
          {visits.slice(0, 6).map((v) => (
            <div
              key={v.id}
              className="flex items-center justify-between px-4 py-3 bg-neutral rounded-xl"
            >
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  v.statut === 'TERMINE'  ? 'bg-success' :
                  v.statut === 'EN_COURS' ? 'bg-accent'  : 'bg-primary'
                }`} />
                <div>
                  <p className="font-medium text-sm">{v.patient?.nom}</p>
                  <p className="text-xs text-gray-400 truncate max-w-[200px]">{v.patient?.address_raw}</p>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-medium text-gray-700">
                  {new Date(v.dateHeure).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </p>
                <span className={`text-xs ${
                  v.statut === 'TERMINE'  ? 'text-success' :
                  v.statut === 'EN_COURS' ? 'text-accent'  : 'text-primary'
                }`}>
                  {v.statut === 'TERMINE' ? 'Terminé' : v.statut === 'EN_COURS' ? 'En cours' : 'Planifié'}
                </span>
              </div>
            </div>
          ))}
          {visits.length > 6 && (
            <p className="text-xs text-center text-gray-400 pt-1">
              + {visits.length - 6} autres visites
            </p>
          )}
        </div>
      </div>

      {/* Raccourcis */}
      <div className="grid grid-cols-2 gap-4">
        <Link to="/map" className="card flex items-center gap-4 hover:shadow-md transition-shadow group">
          <div className="bg-orange-50 text-accent w-12 h-12 rounded-2xl flex items-center justify-center">
            <BoltIcon className="w-6 h-6" />
          </div>
          <div>
            <p className="font-semibold text-gray-800">Optimiser</p>
            <p className="text-xs text-gray-400">Calculer la tournée</p>
          </div>
          <ChevronRightIcon className="w-4 h-4 text-gray-300 ml-auto group-hover:text-gray-500" />
        </Link>
        <Link to="/patients" className="card flex items-center gap-4 hover:shadow-md transition-shadow group">
          <div className="bg-blue-50 text-primary w-12 h-12 rounded-2xl flex items-center justify-center">
            <UserGroupIcon className="w-6 h-6" />
          </div>
          <div>
            <p className="font-semibold text-gray-800">Patients</p>
            <p className="text-xs text-gray-400">{totalPatients} enregistré(s)</p>
          </div>
          <ChevronRightIcon className="w-4 h-4 text-gray-300 ml-auto group-hover:text-gray-500" />
        </Link>
      </div>
    </div>
  );
}

// Import manquant dans le JSX
function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  );
}

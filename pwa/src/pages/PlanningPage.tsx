import { useState, useEffect } from 'react';
import { CheckCircleIcon, ClockIcon, XCircleIcon, PlayIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../hooks/useAuth';

const STATUS_ICON: Record<string, any> = {
  PLANIFIE:  { Icon: ClockIcon,        color: 'text-primary',  bg: 'bg-blue-50' },
  EN_COURS:  { Icon: PlayIcon,         color: 'text-accent',   bg: 'bg-orange-50' },
  TERMINE:   { Icon: CheckCircleIcon,  color: 'text-success',  bg: 'bg-green-50' },
  ANNULE:    { Icon: XCircleIcon,      color: 'text-red-400',  bg: 'bg-red-50' },
};

export default function PlanningPage() {
  const { user, api } = useAuth();
  const today = new Date().toISOString().split('T')[0];
  const [visits, setVisits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.get(`/visits?date=${today}&aideSoignantId=${user?.id}`)
      .then(({ data }) => setVisits(data))
      .catch(() => setVisits([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const setStatus = async (id: string, statut: string) => {
    await api.put(`/visits/${id}`, { statut }).catch(() => {});
    load();
  };

  return (
    <div className="p-5 space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Bonjour, {user?.nom?.split(' ')[0]} 👋</h2>
        <p className="text-gray-400">
          {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      {/* Badge résumé */}
      <div className="flex gap-3">
        <div className="card flex-1 text-center py-3">
          <p className="text-2xl font-bold text-primary">{visits.length}</p>
          <p className="text-xs text-gray-400">Visites</p>
        </div>
        <div className="card flex-1 text-center py-3">
          <p className="text-2xl font-bold text-success">
            {visits.filter(v => v.statut === 'TERMINE').length}
          </p>
          <p className="text-xs text-gray-400">Terminées</p>
        </div>
        <div className="card flex-1 text-center py-3">
          <p className="text-2xl font-bold text-accent">
            {visits.filter(v => v.statut === 'EN_COURS').length}
          </p>
          <p className="text-xs text-gray-400">En cours</p>
        </div>
      </div>

      {/* Liste visites */}
      {loading && <p className="text-center text-gray-400 py-8">Chargement...</p>}

      {!loading && visits.length === 0 && (
        <div className="card text-center py-12">
          <ClockIcon className="w-14 h-14 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400">Aucune visite aujourd'hui</p>
        </div>
      )}

      <div className="space-y-3">
        {visits.map((v, idx) => {
          const { Icon, color, bg } = STATUS_ICON[v.statut] || STATUS_ICON.PLANIFIE;
          return (
            <div key={v.id} className="card">
              <div className="flex items-start gap-4">
                <div className={`${bg} ${color} p-3 rounded-2xl`}>
                  <Icon className="w-7 h-7" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-400">#{idx + 1}</span>
                    <p className="font-semibold text-gray-800 truncate">{v.patient?.nom}</p>
                  </div>
                  <p className="text-sm text-gray-500 truncate">{v.patient?.address_raw}</p>
                  <p className="text-sm font-medium text-primary mt-1">
                    {new Date(v.dateHeure).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    <span className="text-gray-400 font-normal"> · {v.duree} min</span>
                  </p>
                  {v.patient?.access_info && (
                    <p className="text-xs bg-yellow-50 text-yellow-700 rounded-xl px-3 py-1 mt-2 inline-block">
                      {v.patient.access_info}
                    </p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 mt-4">
                {v.statut === 'PLANIFIE' && (
                  <button
                    onClick={() => setStatus(v.id, 'EN_COURS')}
                    className="btn-accent flex-1 text-sm py-0 min-h-[44px]"
                  >
                    Démarrer
                  </button>
                )}
                {v.statut === 'EN_COURS' && (
                  <button
                    onClick={() => setStatus(v.id, 'TERMINE')}
                    className="btn-success flex-1 text-sm py-0 min-h-[44px]"
                  >
                    Terminer
                  </button>
                )}
                {v.patient?.lat && v.patient?.lng && (
                  <a
                    href={`https://maps.apple.com/?daddr=${v.patient.lat},${v.patient.lng}&dirflg=d`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-ghost flex-1 text-sm py-0 min-h-[44px]"
                  >
                    GPS
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

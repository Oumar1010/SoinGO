import { useState, useEffect } from 'react';
import { UserGroupIcon, CalendarIcon, CheckCircleIcon, ClockIcon } from '@heroicons/react/24/outline';
import api from '../services/api';

interface Stats {
  visites_jour: number;
  visites_terminees: number;
  patients_total: number;
  visites_en_cours: number;
}

export default function DashboardPage() {
  const today = new Date().toISOString().split('T')[0];
  const [visits, setVisits] = useState<any[]>([]);
  const [stats, setStats] = useState<Stats>({ visites_jour: 0, visites_terminees: 0, patients_total: 0, visites_en_cours: 0 });

  useEffect(() => {
    api.get(`/visits?date=${today}`).then(({ data }) => {
      setVisits(data);
      setStats({
        visites_jour: data.length,
        visites_terminees: data.filter((v: any) => v.statut === 'TERMINE').length,
        visites_en_cours: data.filter((v: any) => v.statut === 'EN_COURS').length,
        patients_total: new Set(data.map((v: any) => v.patientId)).size,
      });
    }).catch(() => {});
  }, [today]);

  const statCards = [
    { label: 'Visites aujourd\'hui', value: stats.visites_jour, Icon: CalendarIcon, color: 'text-primary' },
    { label: 'Terminées', value: stats.visites_terminees, Icon: CheckCircleIcon, color: 'text-success' },
    { label: 'En cours', value: stats.visites_en_cours, Icon: ClockIcon, color: 'text-accent' },
    { label: 'Patients', value: stats.patients_total, Icon: UserGroupIcon, color: 'text-gray-500' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Tableau de bord</h2>
        <p className="text-gray-500">{new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {statCards.map(({ label, value, Icon, color }) => (
          <div key={label} className="card flex items-center gap-4">
            <Icon className={`w-10 h-10 ${color}`} />
            <div>
              <p className="text-2xl font-bold">{value}</p>
              <p className="text-sm text-gray-500">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Visites du jour */}
      <div className="card">
        <h3 className="font-semibold text-gray-700 mb-4">Visites du jour</h3>
        {visits.length === 0 ? (
          <p className="text-gray-400 text-center py-8">Aucune visite planifiée aujourd'hui</p>
        ) : (
          <div className="space-y-3">
            {visits.map((v) => (
              <div key={v.id} className="flex items-center justify-between p-3 bg-neutral rounded-xl">
                <div>
                  <p className="font-medium">{v.patient?.nom}</p>
                  <p className="text-sm text-gray-500">{v.patient?.address_raw}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">
                    {new Date(v.dateHeure).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    v.statut === 'TERMINE' ? 'bg-green-100 text-success' :
                    v.statut === 'EN_COURS' ? 'bg-orange-100 text-accent' :
                    'bg-blue-100 text-primary'
                  }`}>
                    {v.statut.replace('_', ' ')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

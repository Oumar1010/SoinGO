import { useState, useEffect } from 'react';
import { MapPinIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../hooks/useAuth';

export default function CartePage() {
  const { user, api } = useAuth();
  const today = new Date().toISOString().split('T')[0];
  const [visits, setVisits] = useState<any[]>([]);

  useEffect(() => {
    api.get(`/visits?date=${today}&aideSoignantId=${user?.id}`)
      .then(({ data }) => setVisits(data))
      .catch(() => {});
  }, []);

  const withCoords = visits.filter(v => v.patient?.lat && v.patient?.lng);

  // Ouvre Google Maps avec tous les waypoints
  const openMaps = () => {
    if (withCoords.length === 0) return;
    const waypoints = withCoords
      .slice(1, -1)
      .map(v => `${v.patient.lat},${v.patient.lng}`)
      .join('|');
    const dest = withCoords[withCoords.length - 1].patient;
    const origin = withCoords[0].patient;
    const url = `https://www.google.com/maps/dir/?api=1&origin=${origin.lat},${origin.lng}&destination=${dest.lat},${dest.lng}${waypoints ? `&waypoints=${waypoints}` : ''}&travelmode=driving`;
    window.open(url, '_blank');
  };

  return (
    <div className="p-5 space-y-5">
      <div>
        <h2 className="text-2xl font-bold">Carte</h2>
        <p className="text-gray-400">{withCoords.length} arrêt(s) géolocalisé(s)</p>
      </div>

      {withCoords.length > 0 && (
        <button onClick={openMaps} className="btn-accent w-full">
          <MapPinIcon className="w-6 h-6" />
          Ouvrir la tournée dans Google Maps
        </button>
      )}

      <div className="space-y-3">
        {visits.map((v, idx) => (
          <div key={v.id} className="card flex items-center gap-4">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
              v.statut === 'TERMINE' ? 'bg-success' :
              v.statut === 'EN_COURS' ? 'bg-accent' : 'bg-primary'
            }`}>
              {idx + 1}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">{v.patient?.nom}</p>
              <p className="text-sm text-gray-500 truncate">{v.patient?.address_raw}</p>
            </div>
            {v.patient?.lat && (
              <a
                href={`https://maps.apple.com/?daddr=${v.patient.lat},${v.patient.lng}&dirflg=d`}
                target="_blank"
                rel="noreferrer"
                className="text-primary text-sm font-medium min-h-[44px] flex items-center px-3"
              >
                GPS
              </a>
            )}
          </div>
        ))}

        {visits.length === 0 && (
          <div className="card text-center py-12">
            <MapPinIcon className="w-12 h-12 text-gray-200 mx-auto mb-2" />
            <p className="text-gray-400">Aucune visite aujourd'hui</p>
          </div>
        )}
      </div>
    </div>
  );
}

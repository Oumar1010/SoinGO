import { useState, useEffect, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, Marker, Polyline, InfoWindow } from '@react-google-maps/api';
import { MapPinIcon, BoltIcon } from '@heroicons/react/24/outline';
import api from '../services/api';

const MAP_STYLE = { width: '100%', height: '500px' };
const CENTER_DEFAULT = { lat: 48.8566, lng: 2.3522 }; // Paris

export default function MapPage() {
  const today = new Date().toISOString().split('T')[0];
  const [visits, setVisits] = useState<any[]>([]);
  const [route, setRoute] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [optimizing, setOptimizing] = useState(false);
  const [map, setMap] = useState<google.maps.Map | null>(null);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_KEY || '',
  });

  useEffect(() => {
    api.get(`/visits?date=${today}`).then(({ data }) => setVisits(data)).catch(() => {});
  }, [today]);

  const handleOptimize = async () => {
    const ids = visits.map(v => v.id);
    if (ids.length < 2) return alert('Au moins 2 visites requises');
    const aideSoignantId = visits[0].aideSoignantId;
    setOptimizing(true);
    try {
      const { data } = await api.post('/routes/optimize', { aideSoignantId, date: today, visitIds: ids });
      const coords = data.route.visits
        .map((rv: any) => rv.visit.patient)
        .filter((p: any) => p.lat && p.lng)
        .map((p: any) => ({ lat: p.lat, lng: p.lng }));
      setRoute(coords);
    } catch (e: any) {
      alert(e.response?.data?.message || 'Erreur optimisation');
    } finally {
      setOptimizing(false);
    }
  };

  const onLoad = useCallback((m: google.maps.Map) => setMap(m), []);

  if (!isLoaded) return <div className="text-center p-8 text-gray-500">Chargement de la carte...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Carte des tournées</h2>
          <p className="text-gray-500">{visits.length} visite(s) aujourd'hui</p>
        </div>
        <button onClick={handleOptimize} disabled={optimizing} className="btn-accent">
          <BoltIcon className="w-5 h-5" />
          {optimizing ? 'Calcul...' : 'Optimiser la tournée'}
        </button>
      </div>

      <div className="card overflow-hidden p-0">
        <GoogleMap
          mapContainerStyle={MAP_STYLE}
          center={CENTER_DEFAULT}
          zoom={12}
          onLoad={onLoad}
        >
          {visits.map((v) =>
            v.patient?.lat && v.patient?.lng ? (
              <Marker
                key={v.id}
                position={{ lat: v.patient.lat, lng: v.patient.lng }}
                icon={{ url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png' }}
                onClick={() => setSelected(v)}
              />
            ) : null
          )}

          {route.length > 1 && (
            <Polyline
              path={route}
              options={{ strokeColor: '#FF9F43', strokeWeight: 4, strokeOpacity: 0.8 }}
            />
          )}

          {selected && selected.patient?.lat && (
            <InfoWindow
              position={{ lat: selected.patient.lat, lng: selected.patient.lng }}
              onCloseClick={() => setSelected(null)}
            >
              <div className="p-2">
                <p className="font-semibold">{selected.patient.nom}</p>
                <p className="text-xs text-gray-500">{selected.patient.address_raw}</p>
                <p className="text-xs mt-1">
                  {new Date(selected.dateHeure).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  {' · '}{selected.duree} min
                </p>
              </div>
            </InfoWindow>
          )}
        </GoogleMap>
      </div>

      {/* Liste ordonnée après optimisation */}
      {route.length > 0 && (
        <div className="card">
          <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <MapPinIcon className="w-5 h-5 text-accent" />
            Tournée optimisée
          </h3>
          <div className="space-y-2">
            {visits.map((v, i) => (
              <div key={v.id} className="flex items-center gap-3 p-3 bg-neutral rounded-xl">
                <span className="w-7 h-7 bg-accent text-white rounded-full flex items-center justify-center text-sm font-bold">{i + 1}</span>
                <div>
                  <p className="font-medium text-sm">{v.patient?.nom}</p>
                  <p className="text-xs text-gray-500">{v.patient?.address_raw}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

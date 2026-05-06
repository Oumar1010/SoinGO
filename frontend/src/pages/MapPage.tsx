import { useState, useEffect, useCallback } from 'react';
import {
  GoogleMap,
  useJsApiLoader,
  Marker,
  Polyline,
  InfoWindow,
} from '@react-google-maps/api';
import {
  BoltIcon,
  MapPinIcon,
  ClockIcon,
  TruckIcon,
  ArrowRightIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { exportTourneePDF } from '../services/pdf';

// ── Types ────────────────────────────────────────────────────
interface Leg {
  fromIndex:   number;
  toIndex:     number;
  fromPatient: string;
  toPatient:   string;
  distanceKm:  number;
  durationMin: number;
}
interface PatientData {
  id: string; nom: string; address_raw: string;
  lat?: number; lng?: number; access_info?: string; telephone?: string;
}
interface OrderedVisit {
  ordre:     number;
  visitId:   string;
  dateHeure: string;
  duree:     number;
  statut:    string;
  patient:   PatientData;
}
interface RouteResult {
  legs:          Leg[];
  orderedVisits: OrderedVisit[];
  summary: {
    totalStops: number; distanceTotaleKm: number;
    tempsTotalMin: number; tempsTotalH: string;
  };
}

// ── Palette couleurs par arrêt ───────────────────────────────
const COLORS = ['#2D8CFF','#FF9F43','#2ECC71','#9B59B6','#E74C3C','#1ABC9C','#F39C12'];

// SVG marker — URL simple, sans google.maps.Size/Point
function markerUrl(num: number, color: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="34" height="42" viewBox="0 0 34 42">
    <path d="M17 0C7.6 0 0 7.6 0 17c0 11.6 17 25 17 25S34 28.6 34 17C34 7.6 26.4 0 17 0z" fill="${color}"/>
    <circle cx="17" cy="17" r="10" fill="white"/>
    <text x="17" y="22" font-family="Arial,sans-serif" font-size="11" font-weight="bold"
          fill="${color}" text-anchor="middle">${num}</text>
  </svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

const MAP_CONTAINER = { width: '100%', height: '420px' };
const CENTER_REIMS  = { lat: 49.2535, lng: 4.0270 };

export default function MapPage() {
  const { user } = useAuth();
  const today = new Date().toISOString().split('T')[0];

  const [visits,     setVisits]     = useState<any[]>([]);
  const [result,     setResult]     = useState<RouteResult | null>(null);
  const [selected,   setSelected]   = useState<OrderedVisit | null>(null);
  const [optimizing, setOptimizing] = useState(false);
  const [error,      setError]      = useState('');
  const [mapRef,     setMapRef]     = useState<google.maps.Map | null>(null);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_KEY || '',
  });

  useEffect(() => {
    api.get(`/visits?date=${today}`)
      .then(({ data }) => setVisits(data))
      .catch(() => {});
  }, [today]);

  const handleOptimize = async () => {
    const eligible = visits.filter(v => v.patient?.lat && v.patient?.lng);
    if (eligible.length < 2) {
      setError('Au moins 2 patients géolocalisés requis');
      return;
    }
    setOptimizing(true);
    setError('');
    setSelected(null);
    setResult(null);
    try {
      const { data } = await api.post('/routes/optimize', {
        aideSoignantId: user?.id || eligible[0]?.aideSoignantId,
        date: today,
        visitIds: eligible.map(v => v.id),
      });
      // Diagnostic : structure réelle de la réponse backend
      console.log('[SoinGo] /routes/optimize response:', JSON.stringify(data, null, 2));
      if (!data?.orderedVisits || !Array.isArray(data.orderedVisits)) {
        console.error('[SoinGo] orderedVisits manquant dans la réponse:', data);
        setError('Réponse inattendue du serveur — vérifier les logs backend');
        return;
      }
      setResult(data as RouteResult);
    } catch (e: any) {
      console.error('[SoinGo] optimize error:', e);
      setError(e.response?.data?.message || 'Erreur lors de l\'optimisation');
    } finally {
      setOptimizing(false);
    }
  };

  // Zoom sur tous les marqueurs après chargement du résultat
  useEffect(() => {
    if (!mapRef || !orderedVisits.length) return;
    try {
      const bounds = new window.google.maps.LatLngBounds();
      orderedVisits.forEach(v => {
        if (v.patient.lat && v.patient.lng)
          bounds.extend({ lat: v.patient.lat, lng: v.patient.lng });
      });
      mapRef.fitBounds(bounds, 60);
    } catch {}
  }, [result, mapRef]);

  const onLoad = useCallback((m: google.maps.Map) => setMapRef(m), []);

  const orderedVisits = result?.orderedVisits ?? [];

  const routeCoords = orderedVisits
    .filter(v => v.patient.lat && v.patient.lng)
    .map(v => ({ lat: v.patient.lat!, lng: v.patient.lng! }));

  const tempsSoinsMin = orderedVisits.reduce((a, v) => a + (v.duree ?? 0), 0);

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Carte des tournées</h2>
          <p className="text-gray-400 text-sm">{visits.length} visite(s) · {today}</p>
        </div>
        <div className="flex gap-2">
          {result && (
            <button
              onClick={() => exportTourneePDF(today,
                orderedVisits.map(v => ({ dateHeure: v.dateHeure, duree: v.duree, statut: v.statut, patient: v.patient })),
                user?.nom
              )}
              className="flex items-center gap-2 px-4 py-3 rounded-xl border border-gray-200 text-gray-600 hover:bg-neutral text-sm font-medium"
            >
              <ArrowDownTrayIcon className="w-4 h-4" /> PDF
            </button>
          )}
          <button
            onClick={handleOptimize}
            disabled={optimizing || visits.length < 2}
            className="btn-accent"
          >
            <BoltIcon className="w-5 h-5" />
            {optimizing ? 'Calcul...' : 'Optimiser la tournée'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm">{error}</div>
      )}

      {/* ── Carte Google Maps ── */}
      <div className="card overflow-hidden p-0 relative">
        {!isLoaded ? (
          <div className="flex items-center justify-center h-96 bg-neutral">
            <p className="text-gray-400">Chargement de la carte...</p>
          </div>
        ) : (
          <GoogleMap
            mapContainerStyle={MAP_CONTAINER}
            center={CENTER_REIMS}
            zoom={13}
            onLoad={onLoad}
            options={{ mapTypeControl: false, streetViewControl: false }}
          >
            {/* Marqueurs après optimisation */}
            {result
              ? orderedVisits.map((v, i) =>
                  v.patient.lat && v.patient.lng ? (
                    <Marker
                      key={v.visitId}
                      position={{ lat: v.patient.lat, lng: v.patient.lng }}
                      icon={{ url: markerUrl(i + 1, COLORS[i % COLORS.length]), scaledSize: new window.google.maps.Size(34, 42) }}
                      onClick={() => setSelected(v)}
                    />
                  ) : null
                )
              : visits.map(v =>
                  v.patient?.lat && v.patient?.lng ? (
                    <Marker
                      key={v.id}
                      position={{ lat: v.patient.lat, lng: v.patient.lng }}
                      onClick={() => setSelected(v)}
                    />
                  ) : null
                )
            }

            {/* Tracé orange */}
            {routeCoords.length > 1 && (
              <Polyline
                path={routeCoords}
                options={{ strokeColor: '#FF9F43', strokeWeight: 5, strokeOpacity: 0.85, geodesic: true }}
              />
            )}

            {/* InfoWindow */}
            {selected && selected.patient.lat && selected.patient.lng && (
              <InfoWindow
                position={{ lat: selected.patient.lat, lng: selected.patient.lng }}
                onCloseClick={() => setSelected(null)}
              >
                <div style={{ minWidth: 160, padding: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    {'ordre' in selected && (
                      <span style={{
                        width: 24, height: 24, borderRadius: '50%', display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                        backgroundColor: COLORS[(selected.ordre - 1) % COLORS.length],
                        color: 'white', fontSize: 11, fontWeight: 'bold',
                      }}>
                        {selected.ordre}
                      </span>
                    )}
                    <strong style={{ fontSize: 13 }}>{selected.patient.nom}</strong>
                  </div>
                  <p style={{ fontSize: 12, color: '#666' }}>{selected.patient.address_raw}</p>
                  {selected.patient.access_info && (
                    <p style={{ fontSize: 11, background: '#fef9c3', padding: '2px 6px', borderRadius: 6, marginTop: 4 }}>
                      🔑 {selected.patient.access_info}
                    </p>
                  )}
                  <p style={{ fontSize: 12, color: '#2D8CFF', fontWeight: 600, marginTop: 4 }}>
                    {new Date(selected.dateHeure).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    {' · '}{selected.duree} min
                  </p>
                </div>
              </InfoWindow>
            )}
          </GoogleMap>
        )}

        {/* Badge résumé sur la carte */}
        {result && (
          <div className="absolute bottom-4 left-4 bg-white rounded-2xl shadow-lg px-4 py-3 flex gap-4 text-sm">
            <div className="flex items-center gap-1.5 text-primary">
              <MapPinIcon className="w-4 h-4" />
              <span className="font-bold">{result.summary.totalStops}</span>
              <span className="text-gray-400">arrêts</span>
            </div>
            <div className="w-px bg-gray-100" />
            <div className="flex items-center gap-1.5 text-accent">
              <TruckIcon className="w-4 h-4" />
              <span className="font-bold">{result.summary.distanceTotaleKm} km</span>
            </div>
            <div className="w-px bg-gray-100" />
            <div className="flex items-center gap-1.5 text-success">
              <ClockIcon className="w-4 h-4" />
              <span className="font-bold">{result.summary.tempsTotalH}</span>
            </div>
          </div>
        )}
      </div>

      {/* ── Schéma visuel horizontal ── */}
      {result && (
        <div className="card">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">
            Schéma du parcours
          </p>
          <div className="flex items-start overflow-x-auto pb-3 gap-0">
            {orderedVisits.map((v, i) => {
              const color = COLORS[i % COLORS.length];
              const leg   = result.legs[i];
              return (
                <div key={v.visitId} className="flex items-center flex-shrink-0">
                  {/* Arrêt */}
                  <div
                    className="flex flex-col items-center cursor-pointer group"
                    onClick={() => setSelected(v)}
                  >
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow group-hover:scale-110 transition-transform"
                      style={{ backgroundColor: color }}
                    >
                      {i + 1}
                    </div>
                    <div className="w-0.5 h-3 mt-1" style={{ backgroundColor: color, opacity: 0.4 }} />
                    <div
                      className="rounded-xl px-3 py-2 text-center w-28 shadow-sm border-2"
                      style={{ borderColor: color }}
                    >
                      <p className="text-xs font-bold text-gray-700 truncate leading-tight">{v.patient.nom}</p>
                      <p className="text-xs font-semibold" style={{ color }}>
                        {new Date(v.dateHeure).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      <p className="text-xs text-gray-400">{v.duree} min</p>
                    </div>
                  </div>

                  {/* Trajet inter-arrêts */}
                  {leg && (
                    <div className="flex flex-col items-center mx-1 flex-shrink-0">
                      <div className="flex items-center gap-0.5">
                        <div className="h-0.5 w-6" style={{ backgroundColor: color, opacity: 0.4 }} />
                        <ArrowRightIcon className="w-4 h-4 flex-shrink-0" style={{ color }} />
                        <div className="h-0.5 w-6" style={{ backgroundColor: color, opacity: 0.4 }} />
                      </div>
                      <p className="text-xs font-semibold text-gray-600 mt-1">{leg.distanceKm} km</p>
                      <p className="text-xs text-gray-400">{leg.durationMin} min</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Itinéraire détaillé ── */}
      {result && (
        <div className="grid grid-cols-3 gap-4">
          {/* Liste étapes */}
          <div className="col-span-2 card">
            <h3 className="font-semibold text-gray-700 mb-4">Itinéraire étape par étape</h3>
            <div className="space-y-0">
              {orderedVisits.map((v, i) => {
                const color = COLORS[i % COLORS.length];
                const leg   = result?.legs?.[i];
                return (
                  <div key={v.visitId}>
                    {/* Arrêt */}
                    <div
                      className="flex gap-4 py-3 cursor-pointer hover:bg-neutral rounded-xl px-2 transition-colors"
                      onClick={() => setSelected(v)}
                    >
                      <div className="flex flex-col items-center">
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                          style={{ backgroundColor: color }}
                        >
                          {i + 1}
                        </div>
                        {i < orderedVisits.length - 1 && (
                          <div className="w-0.5 flex-1 mt-1 mb-0" style={{ backgroundColor: color, opacity: 0.2, minHeight: 16 }} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-gray-800">{v.patient.nom}</p>
                          <span className="text-sm font-bold" style={{ color }}>
                            {new Date(v.dateHeure).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-sm text-gray-400 truncate">{v.patient.address_raw}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs bg-blue-50 text-primary px-2 py-0.5 rounded-full">{v.duree} min de soins</span>
                          {v.patient.access_info && (
                            <span className="text-xs text-yellow-700">🔑 {v.patient.access_info}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Trajet vers suivant */}
                    {leg && (
                      <div className="flex items-center gap-2 pl-14 py-1">
                        <ArrowRightIcon className="w-3 h-3 text-gray-300" />
                        <span className="text-xs text-gray-400">
                          <span className="font-semibold text-gray-600">{leg.distanceKm} km</span>
                          {' · '}environ {leg.durationMin} min de trajet
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Résumé */}
          <div className="space-y-4">
            <div className="card bg-primary text-white">
              <p className="text-xs font-semibold opacity-70 uppercase tracking-wide mb-3">Résumé</p>
              <div className="space-y-3">
                <div>
                  <p className="text-3xl font-bold">{result.summary.distanceTotaleKm} km</p>
                  <p className="text-xs opacity-70">distance de trajet total</p>
                </div>
                <div className="h-px bg-white opacity-20" />
                <div>
                  <p className="text-xl font-bold">{result.summary.tempsTotalH}</p>
                  <p className="text-xs opacity-70">temps de trajet</p>
                </div>
                <div className="h-px bg-white opacity-20" />
                <div>
                  <p className="text-xl font-bold">
                    {Math.floor(tempsSoinsMin / 60)}h{String(tempsSoinsMin % 60).padStart(2, '0')}
                  </p>
                  <p className="text-xs opacity-70">temps de soins</p>
                </div>
                <div className="h-px bg-white opacity-20" />
                <div>
                  <p className="text-xl font-bold">{result.summary.totalStops} arrêts</p>
                  <p className="text-xs opacity-70">patients visités</p>
                </div>
              </div>
            </div>

            {/* Légende couleurs */}
            <div className="card">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Légende</p>
              <div className="space-y-2">
                {orderedVisits.map((v, i) => (
                  <div key={v.visitId} className="flex items-center gap-2">
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                      style={{ backgroundColor: COLORS[i % COLORS.length] }}
                    >
                      {i + 1}
                    </div>
                    <span className="text-sm text-gray-600 truncate">{v.patient.nom}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

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

interface OrderedVisit {
  ordre:    number;
  visitId:  string;
  dateHeure: string;
  duree:    number;
  statut:   string;
  patient:  {
    id: string; nom: string; address_raw: string;
    lat?: number; lng?: number; access_info?: string;
  };
}

interface RouteResult {
  legs:          Leg[];
  orderedVisits: OrderedVisit[];
  summary: {
    totalStops:       number;
    distanceTotaleKm: number;
    tempsTotalMin:    number;
    tempsTotalH:      string;
  };
}

// ── Couleurs numérotées ──────────────────────────────────────
const STOP_COLORS = [
  '#2D8CFF', '#FF9F43', '#2ECC71', '#9B59B6',
  '#E74C3C', '#1ABC9C', '#F39C12',
];

const MAP_STYLE = { width: '100%', height: '100%' };
const CENTER_REIMS = { lat: 49.2535, lng: 4.0270 };

// SVG marker numéroté
function makeMarkerIcon(num: number, color: string): google.maps.Icon {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="44" viewBox="0 0 36 44">
      <ellipse cx="18" cy="41" rx="8" ry="3" fill="rgba(0,0,0,0.2)"/>
      <path d="M18 0 C8 0 0 8 0 18 C0 30 18 44 18 44 C18 44 36 30 36 18 C36 8 28 0 18 0Z" fill="${color}"/>
      <circle cx="18" cy="18" r="11" fill="white"/>
      <text x="18" y="23" font-family="Inter,Arial,sans-serif" font-size="12"
            font-weight="bold" fill="${color}" text-anchor="middle">${num}</text>
    </svg>`;
  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: new google.maps.Size(36, 44),
    anchor: new google.maps.Point(18, 44),
  };
}

export default function MapPage() {
  const { user } = useAuth();
  const today    = new Date().toISOString().split('T')[0];

  const [visits,    setVisits]    = useState<any[]>([]);
  const [result,    setResult]    = useState<RouteResult | null>(null);
  const [selected,  setSelected]  = useState<OrderedVisit | null>(null);
  const [optimizing,setOptimizing]= useState(false);
  const [error,     setError]     = useState('');
  const [mapRef,    setMapRef]    = useState<google.maps.Map | null>(null);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_KEY || '',
  });

  useEffect(() => {
    api.get(`/visits?date=${today}`)
      .then(({ data }) => setVisits(data))
      .catch(() => {});
  }, [today]);

  const handleOptimize = async () => {
    const ids = visits.filter(v => v.patient?.lat && v.patient?.lng).map(v => v.id);
    if (ids.length < 2) { setError('Au moins 2 patients géolocalisés requis'); return; }

    const aideSoignantId = user?.id || visits[0]?.aideSoignantId;
    setOptimizing(true);
    setError('');
    setResult(null);

    try {
      const { data } = await api.post('/routes/optimize', {
        aideSoignantId,
        date: today,
        visitIds: ids,
      });
      setResult(data);

      // Zoom sur la zone
      if (mapRef && data.orderedVisits.length > 0) {
        const bounds = new google.maps.LatLngBounds();
        data.orderedVisits.forEach((v: OrderedVisit) => {
          if (v.patient.lat && v.patient.lng)
            bounds.extend({ lat: v.patient.lat, lng: v.patient.lng });
        });
        mapRef.fitBounds(bounds, 60);
      }
    } catch (e: any) {
      setError(e.response?.data?.message || 'Erreur lors de l\'optimisation');
    } finally {
      setOptimizing(false);
    }
  };

  const onLoad = useCallback((m: google.maps.Map) => setMapRef(m), []);

  const routeCoords = result?.orderedVisits
    .filter(v => v.patient.lat && v.patient.lng)
    .map(v => ({ lat: v.patient.lat!, lng: v.patient.lng! })) || [];

  const visitsForPDF = result?.orderedVisits.map(v => ({
    dateHeure: v.dateHeure,
    duree:     v.duree,
    statut:    v.statut,
    patient:   v.patient,
  })) || [];

  return (
    <div className="flex flex-col h-full gap-0 -m-8">
      {/* ── Barre supérieure ── */}
      <div className="flex items-center justify-between px-8 py-4 bg-white border-b border-gray-100">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Carte des tournées</h2>
          <p className="text-sm text-gray-400">{visits.length} visite(s) · {today}</p>
        </div>
        <div className="flex gap-2">
          {result && (
            <button
              onClick={() => exportTourneePDF(today, visitsForPDF, user?.nom)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-neutral text-sm font-medium"
            >
              <ArrowDownTrayIcon className="w-4 h-4" />
              PDF
            </button>
          )}
          <button
            onClick={handleOptimize}
            disabled={optimizing || visits.length < 2}
            className="btn-accent py-2.5 px-5 text-sm"
          >
            <BoltIcon className="w-4 h-4" />
            {optimizing ? 'Calcul en cours...' : 'Optimiser la tournée'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mx-8 mt-3 bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* ── Corps principal ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Colonne gauche : carte ── */}
        <div className="flex-1 relative">
          {!isLoaded ? (
            <div className="absolute inset-0 flex items-center justify-center bg-neutral">
              <p className="text-gray-400">Chargement de la carte...</p>
            </div>
          ) : (
            <GoogleMap
              mapContainerStyle={MAP_STYLE}
              center={CENTER_REIMS}
              zoom={13}
              onLoad={onLoad}
              options={{
                mapTypeControl: false,
                streetViewControl: false,
                fullscreenControl: true,
                zoomControlOptions: { position: google.maps.ControlPosition.RIGHT_CENTER },
              }}
            >
              {/* Marqueurs */}
              {result
                ? result.orderedVisits.map((v, i) =>
                    v.patient.lat && v.patient.lng ? (
                      <Marker
                        key={v.visitId}
                        position={{ lat: v.patient.lat, lng: v.patient.lng }}
                        icon={makeMarkerIcon(i + 1, STOP_COLORS[i % STOP_COLORS.length])}
                        onClick={() => setSelected(v)}
                      />
                    ) : null
                  )
                : visits.map(v =>
                    v.patient?.lat && v.patient?.lng ? (
                      <Marker
                        key={v.id}
                        position={{ lat: v.patient.lat, lng: v.patient.lng }}
                        icon={{ url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png' }}
                      />
                    ) : null
                  )
              }

              {/* Tracé route */}
              {routeCoords.length > 1 && (
                <Polyline
                  path={routeCoords}
                  options={{
                    strokeColor:   '#FF9F43',
                    strokeWeight:  5,
                    strokeOpacity: 0.85,
                    geodesic:      true,
                  }}
                />
              )}

              {/* InfoWindow au clic */}
              {selected && selected.patient.lat && selected.patient.lng && (
                <InfoWindow
                  position={{ lat: selected.patient.lat, lng: selected.patient.lng }}
                  onCloseClick={() => setSelected(null)}
                >
                  <div className="p-1 min-w-[160px]">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                        style={{ backgroundColor: STOP_COLORS[(selected.ordre - 1) % STOP_COLORS.length] }}
                      >
                        {selected.ordre}
                      </span>
                      <p className="font-semibold text-sm">{selected.patient.nom}</p>
                    </div>
                    <p className="text-xs text-gray-500">{selected.patient.address_raw}</p>
                    {selected.patient.access_info && (
                      <p className="text-xs mt-1 text-yellow-700 bg-yellow-50 px-2 py-1 rounded">
                        🔑 {selected.patient.access_info}
                      </p>
                    )}
                    <p className="text-xs mt-1 text-blue-600 font-medium">
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
                <span className="text-gray-400">trajet</span>
              </div>
            </div>
          )}
        </div>

        {/* ── Colonne droite : itinéraire ── */}
        {result && (
          <div className="w-80 bg-white border-l border-gray-100 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="px-5 py-4 border-b border-gray-50">
              <h3 className="font-bold text-gray-800">Itinéraire optimisé</h3>
              <p className="text-xs text-gray-400 mt-0.5">
                {result.summary.totalStops} arrêts · {result.summary.distanceTotaleKm} km · {result.summary.tempsTotalH}
              </p>
            </div>

            {/* Liste étapes */}
            <div className="flex-1 overflow-y-auto py-3">
              {result.orderedVisits.map((v, i) => {
                const color = STOP_COLORS[i % STOP_COLORS.length];
                const leg   = result.legs[i]; // leg APRÈS ce point

                return (
                  <div key={v.visitId}>
                    {/* Arrêt */}
                    <div
                      className="flex gap-3 px-4 py-3 hover:bg-neutral cursor-pointer transition-colors"
                      onClick={() => {
                        setSelected(v);
                        if (mapRef && v.patient.lat && v.patient.lng) {
                          mapRef.panTo({ lat: v.patient.lat, lng: v.patient.lng });
                          mapRef.setZoom(15);
                        }
                      }}
                    >
                      {/* Numéro */}
                      <div className="flex flex-col items-center">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                          style={{ backgroundColor: color }}
                        >
                          {i + 1}
                        </div>
                        {i < result.orderedVisits.length - 1 && (
                          <div className="w-0.5 flex-1 mt-1" style={{ backgroundColor: color, opacity: 0.3, minHeight: '20px' }} />
                        )}
                      </div>

                      {/* Infos arrêt */}
                      <div className="flex-1 min-w-0 pb-1">
                        <p className="font-semibold text-sm text-gray-800 truncate">{v.patient.nom}</p>
                        <p className="text-xs text-gray-400 truncate">{v.patient.address_raw}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs font-medium text-primary">
                            {new Date(v.dateHeure).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span className="text-xs text-gray-300">·</span>
                          <span className="text-xs text-gray-400">{v.duree} min</span>
                        </div>
                        {v.patient.access_info && (
                          <p className="text-xs text-yellow-700 bg-yellow-50 px-2 py-0.5 rounded-lg mt-1 truncate">
                            🔑 {v.patient.access_info}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Trajet vers prochain arrêt */}
                    {leg && (
                      <div className="flex items-center gap-2 px-4 py-1.5 ml-4">
                        <div className="w-0.5 h-3" style={{ backgroundColor: color, opacity: 0.3 }} />
                        <div className="flex items-center gap-1.5 text-xs text-gray-400 ml-3">
                          <ArrowRightIcon className="w-3 h-3" />
                          <span className="font-medium text-gray-500">{leg.distanceKm} km</span>
                          <span>·</span>
                          <span>≈ {leg.durationMin} min</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Footer résumé */}
            <div className="border-t border-gray-100 px-5 py-4 bg-neutral">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Résumé tournée</p>
              <div className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Distance trajet</span>
                  <span className="font-bold text-accent">{result.summary.distanceTotaleKm} km</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Temps de trajet</span>
                  <span className="font-bold text-primary">{result.summary.tempsTotalH}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Temps de soins</span>
                  <span className="font-bold text-success">
                    {Math.floor(result.orderedVisits.reduce((a, v) => a + v.duree, 0) / 60)}h
                    {result.orderedVisits.reduce((a, v) => a + v.duree, 0) % 60}min
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Schéma visuel horizontal (affiché si résultat) ── */}
      {result && (
        <div className="bg-white border-t border-gray-100 px-8 py-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">Schéma de parcours</p>
          <div className="flex items-center overflow-x-auto pb-2 gap-0">
            {result.orderedVisits.map((v, i) => {
              const color = STOP_COLORS[i % STOP_COLORS.length];
              const leg   = result.legs[i];

              return (
                <div key={v.visitId} className="flex items-center flex-shrink-0">
                  {/* Carte arrêt */}
                  <div
                    className="flex flex-col items-center cursor-pointer group"
                    onClick={() => {
                      setSelected(v);
                      if (mapRef && v.patient.lat && v.patient.lng) {
                        mapRef.panTo({ lat: v.patient.lat, lng: v.patient.lng });
                        mapRef.setZoom(15);
                      }
                    }}
                  >
                    {/* Bulle numérotée */}
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md group-hover:scale-110 transition-transform"
                      style={{ backgroundColor: color }}
                    >
                      {i + 1}
                    </div>
                    {/* Trait vertical */}
                    <div className="w-0.5 h-2 mt-1" style={{ backgroundColor: color }} />
                    {/* Carte info */}
                    <div
                      className="border-2 rounded-xl px-3 py-2 text-center max-w-[110px] shadow-sm"
                      style={{ borderColor: color }}
                    >
                      <p className="text-xs font-bold text-gray-700 leading-tight truncate">{v.patient.nom}</p>
                      <p className="text-xs font-semibold mt-0.5" style={{ color }}>
                        {new Date(v.dateHeure).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      <p className="text-xs text-gray-400">{v.duree} min</p>
                    </div>
                  </div>

                  {/* Flèche + distance entre 2 arrêts */}
                  {leg && (
                    <div className="flex flex-col items-center mx-2 flex-shrink-0">
                      <div className="flex items-center gap-1">
                        <div className="h-0.5 w-8" style={{ backgroundColor: color, opacity: 0.4 }} />
                        <ArrowRightIcon className="w-4 h-4 flex-shrink-0" style={{ color }} />
                        <div className="h-0.5 w-8" style={{ backgroundColor: color, opacity: 0.4 }} />
                      </div>
                      <div className="text-center mt-1">
                        <p className="text-xs font-bold text-gray-600">{leg.distanceKm} km</p>
                        <p className="text-xs text-gray-400">{leg.durationMin} min</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

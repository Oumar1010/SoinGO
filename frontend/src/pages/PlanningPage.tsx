import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  ChevronLeftIcon, ChevronRightIcon, PlusIcon, XMarkIcon,
  CalendarDaysIcon, UserGroupIcon, ClockIcon, TrashIcon,
} from '@heroicons/react/24/outline';
import api from '../services/api';

// ── Types ──────────────────────────────────────────────────────
interface Patient { id: string; nom: string; address_raw: string }
interface User    { id: string; nom: string; role: string }
interface Visit {
  id: string; dateHeure: string; duree: number; statut: string;
  notes?: string;
  patient:       { id: string; nom: string };
  aideSoignant:  { id: string; nom: string };
}

const JOURS_SEMAINE = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const JOURS_FULL   = ['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche'];

const STATUT_STYLES: Record<string, string> = {
  PLANIFIE:  'bg-blue-100 text-primary',
  EN_COURS:  'bg-orange-100 text-accent',
  TERMINE:   'bg-green-100 text-success',
  ANNULE:    'bg-gray-100 text-gray-400',
};

// ── Helpers ────────────────────────────────────────────────────
function getDaysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}
function getFirstDayOfMonth(year: number, month: number) {
  // 0=Dim → convert to Mon-based index (0=Lun)
  const d = new Date(year, month - 1, 1).getDay();
  return d === 0 ? 6 : d - 1;
}

// ── Modal: générer planning récurrent ─────────────────────────
function BulkModal({
  patients, aides, year, month, onClose, onCreated,
}: {
  patients: Patient[]; aides: User[];
  year: number; month: number;
  onClose: () => void; onCreated: () => void;
}) {
  const [patientId,      setPatientId]      = useState('');
  const [aideSoignantId, setAideSoignantId] = useState('');
  const [jours,          setJours]          = useState<number[]>([1,2,3,4,5]);
  const [heure,          setHeure]          = useState(8);
  const [minute,         setMinute]         = useState(0);
  const [duree,          setDuree]          = useState(45);
  const [notes,          setNotes]          = useState('');
  const [loading,        setLoading]        = useState(false);

  const monthStr = String(month).padStart(2, '0');
  const lastDay  = getDaysInMonth(year, month);
  const dateDebut = `${year}-${monthStr}-01`;
  const dateFin   = `${year}-${monthStr}-${lastDay}`;

  const toggleJour = (j: number) =>
    setJours(prev => prev.includes(j) ? prev.filter(x => x !== j) : [...prev, j].sort());

  const handleSubmit = async () => {
    if (!patientId)      return toast.error('Choisir un patient');
    if (!aideSoignantId) return toast.error('Choisir un aide-soignant');
    if (jours.length === 0) return toast.error('Sélectionner au moins un jour');

    setLoading(true);
    try {
      const { data } = await api.post('/visits/bulk', {
        patientId, aideSoignantId, joursRepetition: jours,
        heure, minute, duree, notes, dateDebut, dateFin,
      });
      toast.success(`${data.created} visite(s) créée(s) pour ${monthStr}/${year}`);
      onCreated();
      onClose();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Erreur de création');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6"
        onClick={e => e.stopPropagation()}>

        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-lg font-bold text-gray-800">Générer un planning</h3>
            <p className="text-sm text-gray-400">
              Crée des visites récurrentes pour{' '}
              <strong>{new Date(year, month - 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</strong>
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-neutral rounded-xl transition-colors">
            <XMarkIcon className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Patient */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Patient</label>
            <select value={patientId} onChange={e => setPatientId(e.target.value)}
              className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary">
              <option value="">Choisir un patient...</option>
              {patients.map(p => <option key={p.id} value={p.id}>{p.nom}</option>)}
            </select>
          </div>

          {/* Aide-soignant */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Aide-soignant</label>
            <select value={aideSoignantId} onChange={e => setAideSoignantId(e.target.value)}
              className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary">
              <option value="">Choisir un aide-soignant...</option>
              {aides.map(a => <option key={a.id} value={a.id}>{a.nom}</option>)}
            </select>
          </div>

          {/* Jours de la semaine */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Jours de répétition</label>
            <div className="flex gap-2 mt-2">
              {JOURS_SEMAINE.map((j, i) => {
                const num = i + 1;
                const active = jours.includes(num);
                return (
                  <button key={num} onClick={() => toggleJour(num)}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                      active ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}>
                    {j}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Heure + Durée */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Heure</label>
              <select value={heure} onChange={e => setHeure(+e.target.value)}
                className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary">
                {[...Array(24)].map((_, h) => (
                  <option key={h} value={h}>{String(h).padStart(2,'0')}h</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Minute</label>
              <select value={minute} onChange={e => setMinute(+e.target.value)}
                className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary">
                {[0,15,30,45].map(m => (
                  <option key={m} value={m}>{String(m).padStart(2,'0')}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Durée (min)</label>
              <select value={duree} onChange={e => setDuree(+e.target.value)}
                className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary">
                {[15,30,45,60,90,120].map(d => (
                  <option key={d} value={d}>{d} min</option>
                ))}
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Notes (optionnel)</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)}
              rows={2} placeholder="Instructions, soins particuliers..."
              className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none" />
          </div>

          {/* Résumé */}
          {patientId && aideSoignantId && jours.length > 0 && (
            <div className="bg-blue-50 rounded-xl p-3 text-sm text-primary">
              <strong>Aperçu :</strong> visites chaque{' '}
              {jours.map(j => JOURS_FULL[j - 1]).join(', ')}{' '}
              à {String(heure).padStart(2,'0')}h{String(minute).padStart(2,'0')}{' '}
              ({duree} min) du 01 au {getDaysInMonth(year, month)}/{monthStr}/{year}
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-neutral transition-colors">
            Annuler
          </button>
          <button onClick={handleSubmit} disabled={loading}
            className="flex-1 btn-primary text-sm py-2.5 disabled:opacity-60">
            {loading ? 'Création...' : 'Générer le planning'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Modal: détail d'une visite ────────────────────────────────
function VisitDetailModal({ visit, onClose, onDelete }: {
  visit: Visit; onClose: () => void;
  onDelete: (id: string) => void;
}) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Supprimer la visite de ${visit.patient.nom} ?`)) return;
    setDeleting(true);
    try {
      await api.delete(`/visits/${visit.id}`);
      toast.success('Visite supprimée');
      onDelete(visit.id);
      onClose();
    } catch {
      toast.error('Erreur lors de la suppression');
      setDeleting(false);
    }
  };

  const dt = new Date(visit.dateHeure);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6"
        onClick={e => e.stopPropagation()}>

        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-bold text-gray-800">{visit.patient.nom}</h3>
            <p className="text-sm text-gray-400">
              {dt.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
              {' · '}{dt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-neutral rounded-lg">
            <XMarkIcon className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        <div className="space-y-3 text-sm">
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUT_STYLES[visit.statut]}`}>
              {visit.statut.replace('_', ' ')}
            </span>
            <span className="text-gray-500">{visit.duree} min de soins</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <UserGroupIcon className="w-4 h-4 text-gray-400" />
            {visit.aideSoignant.nom}
          </div>
          {visit.notes && (
            <div className="bg-yellow-50 rounded-xl p-3 text-yellow-800 text-xs">
              📋 {visit.notes}
            </div>
          )}
        </div>

        <button onClick={handleDelete} disabled={deleting}
          className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-red-200 text-red-500 hover:bg-red-50 transition-colors text-sm font-medium disabled:opacity-60">
          <TrashIcon className="w-4 h-4" />
          {deleting ? 'Suppression...' : 'Supprimer cette visite'}
        </button>
      </motion.div>
    </motion.div>
  );
}

// ── Page principale ────────────────────────────────────────────
export default function PlanningPage() {
  const now   = new Date();
  const [year,  setYear]  = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const [visits,   setVisits]   = useState<Visit[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [aides,    setAides]    = useState<User[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [showBulk, setShowBulk] = useState(false);
  const [selected, setSelected] = useState<Visit | null>(null);
  const [filterAs, setFilterAs] = useState('');

  const loadVisits = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/visits?year=${year}&month=${month}${filterAs ? `&aideSoignantId=${filterAs}` : ''}`);
      setVisits(data);
    } catch {
      toast.error('Erreur chargement des visites');
    } finally {
      setLoading(false);
    }
  }, [year, month, filterAs]);

  useEffect(() => { loadVisits(); }, [loadVisits]);

  useEffect(() => {
    api.get('/patients').then(({ data }) => setPatients(data)).catch(() => {});
    api.get('/users').then(({ data }) => setAides(data.filter((u: User) => u.role === 'AIDE_SOIGNANT'))).catch(() => {});
  }, []);

  const prevMonth = () => {
    if (month === 1) { setYear(y => y - 1); setMonth(12); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 12) { setYear(y => y + 1); setMonth(1); }
    else setMonth(m => m + 1);
  };

  // Grouper visites par jour du mois
  const byDay: Record<number, Visit[]> = {};
  for (const v of visits) {
    const d = new Date(v.dateHeure).getDate();
    if (!byDay[d]) byDay[d] = [];
    byDay[d].push(v);
  }

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay    = getFirstDayOfMonth(year, month);
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  // Pad to complete grid of 6 rows
  while (cells.length % 7 !== 0) cells.push(null);

  const AIDE_COLORS = ['#2D8CFF','#FF9F43','#2ECC71','#9B59B6','#E74C3C','#1ABC9C'];
  const aideColorMap: Record<string, string> = {};
  aides.forEach((a, i) => { aideColorMap[a.id] = AIDE_COLORS[i % AIDE_COLORS.length]; });

  const totalVisites = visits.length;
  const totalTerminees = visits.filter(v => v.statut === 'TERMINE').length;

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-gray-800">Planning mensuel</h2>
          <p className="text-gray-400 text-sm">
            {totalVisites} visite(s) · {totalTerminees} terminée(s)
          </p>
        </div>
        <div className="flex gap-2">
          {/* Filtre aide-soignant */}
          <select value={filterAs} onChange={e => setFilterAs(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
            <option value="">Tous les aides-soignants</option>
            {aides.map(a => <option key={a.id} value={a.id}>{a.nom}</option>)}
          </select>
          <button onClick={() => setShowBulk(true)} className="btn-primary flex items-center gap-2 text-sm">
            <PlusIcon className="w-4 h-4" /> Générer planning
          </button>
        </div>
      </div>

      {/* Navigation mois */}
      <div className="card">
        <div className="flex items-center justify-between mb-5">
          <button onClick={prevMonth}
            className="p-2 hover:bg-neutral rounded-xl transition-colors">
            <ChevronLeftIcon className="w-5 h-5 text-gray-500" />
          </button>
          <div className="text-center">
            <h3 className="text-lg font-black text-gray-800 capitalize">
              {new Date(year, month - 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
            </h3>
            {/* Légende aides-soignants */}
            {aides.length > 0 && (
              <div className="flex items-center gap-3 justify-center mt-1 flex-wrap">
                {aides.map(a => (
                  <span key={a.id} className="flex items-center gap-1.5 text-xs text-gray-500">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: aideColorMap[a.id] }} />
                    {a.nom}
                  </span>
                ))}
              </div>
            )}
          </div>
          <button onClick={nextMonth}
            className="p-2 hover:bg-neutral rounded-xl transition-colors">
            <ChevronRightIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* En-têtes jours */}
        <div className="grid grid-cols-7 mb-2">
          {JOURS_SEMAINE.map(j => (
            <div key={j} className="text-center text-xs font-semibold text-gray-400 py-2">{j}</div>
          ))}
        </div>

        {/* Grille calendrier */}
        {loading ? (
          <div className="grid grid-cols-7 gap-1">
            {[...Array(35)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-50 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-1">
            {cells.map((day, idx) => {
              if (!day) return <div key={idx} className="h-24 rounded-xl" />;

              const dayVisits = byDay[day] ?? [];
              const isToday   = day === now.getDate() && month === now.getMonth() + 1 && year === now.getFullYear();

              return (
                <div key={idx}
                  className={`min-h-24 rounded-xl p-1.5 transition-colors ${
                    isToday ? 'bg-primary/5 ring-2 ring-primary/30' : 'hover:bg-gray-50'
                  }`}>
                  <div className={`text-xs font-bold mb-1 w-6 h-6 flex items-center justify-center rounded-full ${
                    isToday ? 'bg-primary text-white' : 'text-gray-400'
                  }`}>
                    {day}
                  </div>
                  <div className="space-y-0.5">
                    {dayVisits.slice(0, 3).map(v => (
                      <button key={v.id}
                        onClick={() => setSelected(v)}
                        className="w-full text-left rounded-md px-1 py-0.5 text-xs truncate font-medium transition-opacity hover:opacity-80"
                        style={{
                          backgroundColor: (aideColorMap[v.aideSoignant.id] ?? '#2D8CFF') + '22',
                          color:            aideColorMap[v.aideSoignant.id] ?? '#2D8CFF',
                        }}>
                        {new Date(v.dateHeure).toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' })}
                        {' '}{v.patient.nom.split(' ').pop()}
                      </button>
                    ))}
                    {dayVisits.length > 3 && (
                      <p className="text-xs text-gray-400 pl-1">+{dayVisits.length - 3} autre(s)</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Résumé bas de page */}
      {!loading && visits.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="grid grid-cols-4 gap-4">
          {[
            { label: 'Total visites', val: totalVisites, color: 'text-primary' },
            { label: 'Terminées',     val: totalTerminees, color: 'text-success' },
            { label: 'Planifiées',    val: visits.filter(v => v.statut === 'PLANIFIE').length, color: 'text-accent' },
            { label: 'Annulées',      val: visits.filter(v => v.statut === 'ANNULE').length, color: 'text-gray-400' },
          ].map(({ label, val, color }) => (
            <div key={label} className="card text-center">
              <p className={`text-2xl font-black ${color}`}>{val}</p>
              <p className="text-xs text-gray-400 mt-0.5">{label}</p>
            </div>
          ))}
        </motion.div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {showBulk && (
          <BulkModal
            patients={patients} aides={aides}
            year={year} month={month}
            onClose={() => setShowBulk(false)}
            onCreated={loadVisits}
          />
        )}
        {selected && (
          <VisitDetailModal
            visit={selected}
            onClose={() => setSelected(null)}
            onDelete={id => {
              setVisits(prev => prev.filter(v => v.id !== id));
              setSelected(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

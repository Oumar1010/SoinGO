import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  PlusIcon, CalendarIcon, ArrowDownTrayIcon,
  XMarkIcon, TrashIcon, ClockIcon, UserGroupIcon,
} from '@heroicons/react/24/outline';
import api from '../services/api';
import { exportTourneePDF } from '../services/pdf';

const STATUS_LABELS: Record<string, string> = {
  PLANIFIE: 'Planifié',
  EN_COURS: 'En cours',
  TERMINE:  'Terminé',
  ANNULE:   'Annulé',
};
const STATUS_STYLES: Record<string, string> = {
  PLANIFIE: 'bg-blue-100 text-primary',
  EN_COURS: 'bg-orange-100 text-accent',
  TERMINE:  'bg-green-100 text-success',
  ANNULE:   'bg-gray-100 text-gray-400',
};

// ── Modal création visite ──────────────────────────────────────
function CreateVisitModal({ date, patients, users, onClose, onCreated }: {
  date: string; patients: any[]; users: any[];
  onClose: () => void; onCreated: () => void;
}) {
  const defaultDT = `${date}T08:00`;
  const [form, setForm] = useState({
    patientId: '', aideSoignantId: '', dateHeure: defaultDT, duree: 45, notes: '',
  });
  const [loading, setLoading] = useState(false);

  const set = (k: string) => (e: any) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.patientId)      return toast.error('Choisir un patient');
    if (!form.aideSoignantId) return toast.error('Choisir un aide-soignant');
    setLoading(true);
    try {
      await api.post('/visits', form);
      toast.success('Visite planifiée');
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
          <h3 className="text-lg font-bold text-gray-800">Nouvelle visite</h3>
          <button onClick={onClose} className="p-2 hover:bg-neutral rounded-xl">
            <XMarkIcon className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Patient</label>
            <select value={form.patientId} onChange={set('patientId')}
              className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary">
              <option value="">Sélectionner un patient...</option>
              {patients.map(p => <option key={p.id} value={p.id}>{p.nom}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Aide-soignant</label>
            <select value={form.aideSoignantId} onChange={set('aideSoignantId')}
              className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary">
              <option value="">Sélectionner un aide-soignant...</option>
              {users.filter(u => u.role === 'AIDE_SOIGNANT').map(u => (
                <option key={u.id} value={u.id}>{u.nom}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Date & heure</label>
              <input type="datetime-local" value={form.dateHeure} onChange={set('dateHeure')}
                className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Durée (min)</label>
              <select value={form.duree} onChange={e => setForm(f => ({ ...f, duree: +e.target.value }))}
                className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary">
                {[15,30,45,60,90,120].map(d => <option key={d} value={d}>{d} min</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Notes</label>
            <textarea value={form.notes} onChange={set('notes')} rows={2}
              placeholder="Soins à effectuer, instructions..."
              className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none" />
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-neutral">
              Annuler
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 btn-primary text-sm py-2.5 disabled:opacity-60">
              {loading ? 'Création...' : 'Planifier la visite'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

// ── Page principale ────────────────────────────────────────────
export default function VisitsPage() {
  const today = new Date().toISOString().split('T')[0];
  const [date,      setDate]      = useState(today);
  const [visits,    setVisits]    = useState<any[]>([]);
  const [patients,  setPatients]  = useState<any[]>([]);
  const [users,     setUsers]     = useState<any[]>([]);
  const [showForm,  setShowForm]  = useState(false);
  const [filterAs,  setFilterAs]  = useState('');
  const [deleting,  setDeleting]  = useState<string | null>(null);

  const load = useCallback(() => {
    api.get(`/visits?date=${date}${filterAs ? `&aideSoignantId=${filterAs}` : ''}`)
      .then(({ data }) => setVisits(data))
      .catch(() => {});
  }, [date, filterAs]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    api.get('/patients').then(({ data }) => setPatients(data)).catch(() => {});
    api.get('/users').then(({ data }) => setUsers(data)).catch(() => {});
  }, []);

  const updateStatus = async (id: string, statut: string) => {
    try {
      await api.put(`/visits/${id}`, { statut });
      setVisits(prev => prev.map(v => v.id === id ? { ...v, statut } : v));
      toast.success('Statut mis à jour');
    } catch {
      toast.error('Erreur mise à jour');
    }
  };

  const deleteVisit = async (id: string) => {
    if (!confirm('Supprimer cette visite ?')) return;
    setDeleting(id);
    try {
      await api.delete(`/visits/${id}`);
      setVisits(prev => prev.filter(v => v.id !== id));
      toast.success('Visite supprimée');
    } catch {
      toast.error('Erreur suppression');
    } finally {
      setDeleting(null);
    }
  };

  const aides = users.filter(u => u.role === 'AIDE_SOIGNANT');

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-gray-800">Visites du jour</h2>
          <p className="text-gray-400 text-sm">{visits.length} visite(s) planifiée(s)</p>
        </div>
        <div className="flex items-center gap-2">
          {visits.length > 0 && (
            <button onClick={() => exportTourneePDF(date, visits)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-neutral text-sm font-medium transition-colors">
              <ArrowDownTrayIcon className="w-4 h-4" /> PDF
            </button>
          )}
          <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2 text-sm">
            <PlusIcon className="w-4 h-4" /> Nouvelle visite
          </button>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex items-center gap-3">
        <input type="date" value={date} onChange={e => setDate(e.target.value)}
          className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
        <select value={filterAs} onChange={e => setFilterAs(e.target.value)}
          className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary">
          <option value="">Tous les aides-soignants</option>
          {aides.map(a => <option key={a.id} value={a.id}>{a.nom}</option>)}
        </select>
      </div>

      {/* Liste */}
      <div className="space-y-2">
        {visits.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="card text-center py-16">
            <CalendarIcon className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 font-medium">Aucune visite pour cette date</p>
            <button onClick={() => setShowForm(true)}
              className="mt-4 btn-primary text-sm inline-flex items-center gap-2">
              <PlusIcon className="w-4 h-4" /> Planifier une visite
            </button>
          </motion.div>
        )}

        <AnimatePresence>
          {visits.map((v, i) => (
            <motion.div key={v.id}
              initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }} transition={{ delay: i * 0.04 }}
              className="card hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">

                {/* Heure */}
                <div className="text-center min-w-[64px] flex-shrink-0">
                  <p className="text-lg font-black text-primary leading-tight">
                    {new Date(v.dateHeure).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <p className="text-xs text-gray-400 flex items-center gap-0.5 justify-center">
                    <ClockIcon className="w-3 h-3" />{v.duree} min
                  </p>
                </div>

                {/* Séparateur */}
                <div className="w-px h-10 bg-gray-100 flex-shrink-0" />

                {/* Info patient */}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-800 truncate">{v.patient?.nom}</p>
                  <p className="text-sm text-gray-400 truncate">{v.patient?.address_raw}</p>
                  {v.notes && (
                    <p className="text-xs text-yellow-700 bg-yellow-50 rounded-lg px-2 py-0.5 mt-1 inline-block truncate max-w-full">
                      📋 {v.notes}
                    </p>
                  )}
                </div>

                {/* Aide-soignant */}
                <div className="flex items-center gap-1.5 text-xs text-gray-500 flex-shrink-0 hidden md:flex">
                  <UserGroupIcon className="w-3.5 h-3.5" />
                  {v.aideSoignant?.nom?.split(' ')[0]}
                </div>

                {/* Statut */}
                <select value={v.statut} onChange={e => updateStatus(v.id, e.target.value)}
                  className={`text-xs px-3 py-1.5 rounded-xl border-0 font-semibold cursor-pointer flex-shrink-0 ${STATUS_STYLES[v.statut]}`}>
                  {Object.entries(STATUS_LABELS).map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>

                {/* Supprimer */}
                <button onClick={() => deleteVisit(v.id)} disabled={deleting === v.id}
                  className="p-1.5 text-gray-300 hover:text-red-400 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0">
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {showForm && (
          <CreateVisitModal
            date={date} patients={patients} users={users}
            onClose={() => setShowForm(false)} onCreated={load}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

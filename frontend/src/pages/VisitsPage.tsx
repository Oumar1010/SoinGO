import { useState, useEffect } from 'react';
import { PlusIcon, CalendarIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import api from '../services/api';
import { exportTourneePDF } from '../services/pdf';

const STATUS_LABELS: Record<string, string> = {
  PLANIFIE: 'Planifié',
  EN_COURS: 'En cours',
  TERMINE: 'Terminé',
  ANNULE: 'Annulé',
};

export default function VisitsPage() {
  const today = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(today);
  const [visits, setVisits] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ patientId: '', aideSoignantId: '', dateHeure: '', duree: 30, notes: '' });

  const load = () => {
    api.get(`/visits?date=${date}`).then(({ data }) => setVisits(data)).catch(() => {});
  };

  useEffect(() => { load(); }, [date]);
  useEffect(() => {
    api.get('/patients').then(({ data }) => setPatients(data)).catch(() => {});
    api.get('/users').then(({ data }) => setUsers(data)).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/visits', form);
      setShowForm(false);
      load();
    } catch (e: any) {
      alert(e.response?.data?.message || 'Erreur');
    }
  };

  const updateStatus = async (id: string, statut: string) => {
    await api.put(`/visits/${id}`, { statut }).catch(() => {});
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold text-gray-800">Visites</h2>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="px-3 py-2 rounded-xl border border-gray-200 text-sm"
          />
        </div>
        <div className="flex gap-2">
          {visits.length > 0 && (
            <button
              onClick={() => exportTourneePDF(date, visits)}
              className="flex items-center gap-2 px-4 py-3 rounded-xl border border-gray-200 text-gray-600 hover:bg-neutral font-medium text-sm"
            >
              <ArrowDownTrayIcon className="w-4 h-4" />
              PDF
            </button>
          )}
          <button onClick={() => setShowForm(!showForm)} className="btn-primary">
            <PlusIcon className="w-5 h-5" />
            Planifier
          </button>
        </div>
      </div>

      {showForm && (
        <div className="card">
          <h3 className="font-semibold mb-4">Nouvelle visite</h3>
          <form onSubmit={handleSubmit} className="space-y-3">
            <select
              className="w-full px-4 py-3 rounded-xl border border-gray-200"
              value={form.patientId}
              onChange={e => setForm({ ...form, patientId: e.target.value })}
              required
            >
              <option value="">Sélectionner un patient *</option>
              {patients.map(p => <option key={p.id} value={p.id}>{p.nom}</option>)}
            </select>
            <select
              className="w-full px-4 py-3 rounded-xl border border-gray-200"
              value={form.aideSoignantId}
              onChange={e => setForm({ ...form, aideSoignantId: e.target.value })}
              required
            >
              <option value="">Sélectionner un aide-soignant *</option>
              {users.filter(u => u.role === 'AIDE_SOIGNANT').map(u => <option key={u.id} value={u.id}>{u.nom}</option>)}
            </select>
            <input
              type="datetime-local"
              className="w-full px-4 py-3 rounded-xl border border-gray-200"
              value={form.dateHeure}
              onChange={e => setForm({ ...form, dateHeure: e.target.value })}
              required
            />
            <div className="flex items-center gap-3">
              <label className="text-sm text-gray-600">Durée (min)</label>
              <input
                type="number"
                min={5}
                className="w-24 px-3 py-2 rounded-xl border border-gray-200 text-center"
                value={form.duree}
                onChange={e => setForm({ ...form, duree: parseInt(e.target.value) })}
              />
            </div>
            <textarea
              className="w-full px-4 py-3 rounded-xl border border-gray-200"
              placeholder="Notes (optionnel)"
              value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })}
              rows={2}
            />
            <div className="flex gap-3">
              <button type="submit" className="btn-primary">Planifier</button>
              <button type="button" onClick={() => setShowForm(false)} className="px-6 py-4 rounded-xl border border-gray-200 text-gray-600">Annuler</button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-3">
        {visits.length === 0 && (
          <div className="card text-center py-12">
            <CalendarIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400">Aucune visite pour cette date</p>
          </div>
        )}
        {visits.map((v) => (
          <div key={v.id} className="card flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-center min-w-[60px]">
                <p className="text-lg font-bold text-primary">
                  {new Date(v.dateHeure).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </p>
                <p className="text-xs text-gray-400">{v.duree} min</p>
              </div>
              <div>
                <p className="font-semibold">{v.patient?.nom}</p>
                <p className="text-sm text-gray-500">{v.patient?.address_raw}</p>
                <p className="text-xs text-gray-400">Par {v.aideSoignant?.nom}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={v.statut}
                onChange={e => updateStatus(v.id, e.target.value)}
                className={`text-sm px-3 py-2 rounded-xl border-0 font-medium ${
                  v.statut === 'TERMINE' ? 'bg-green-100 text-success' :
                  v.statut === 'EN_COURS' ? 'bg-orange-100 text-accent' :
                  v.statut === 'ANNULE' ? 'bg-red-100 text-red-500' :
                  'bg-blue-100 text-primary'
                }`}
              >
                {Object.entries(STATUS_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

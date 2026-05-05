import { useState, useEffect } from 'react';
import { PlusIcon, MapPinIcon } from '@heroicons/react/24/outline';
import api from '../services/api';

export default function PatientsPage() {
  const [patients, setPatients] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ nom: '', address_raw: '', telephone: '', access_info: '' });
  const [loading, setLoading] = useState(false);

  const load = () => api.get('/patients').then(({ data }) => setPatients(data)).catch(() => {});

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/patients', form);
      setShowForm(false);
      setForm({ nom: '', address_raw: '', telephone: '', access_info: '' });
      load();
    } catch (e: any) {
      alert(e.response?.data?.message || 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Patients ({patients.length})</h2>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          <PlusIcon className="w-5 h-5" />
          Nouveau patient
        </button>
      </div>

      {showForm && (
        <div className="card">
          <h3 className="font-semibold mb-4">Ajouter un patient</h3>
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-primary"
              placeholder="Nom complet *"
              value={form.nom}
              onChange={e => setForm({ ...form, nom: e.target.value })}
              required
            />
            <input
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-primary"
              placeholder="Adresse complète * (géocodage automatique)"
              value={form.address_raw}
              onChange={e => setForm({ ...form, address_raw: e.target.value })}
              required
            />
            <input
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-primary"
              placeholder="Téléphone"
              value={form.telephone}
              onChange={e => setForm({ ...form, telephone: e.target.value })}
            />
            <textarea
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-primary"
              placeholder="Informations d'accès (code portail, étage...)"
              value={form.access_info}
              onChange={e => setForm({ ...form, access_info: e.target.value })}
              rows={2}
            />
            <div className="flex gap-3">
              <button type="submit" disabled={loading} className="btn-primary">
                {loading ? 'Enregistrement...' : 'Enregistrer'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="px-6 py-4 rounded-xl border border-gray-200 text-gray-600 hover:bg-neutral">
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {patients.map((p) => (
          <div key={p.id} className="card space-y-2">
            <h4 className="font-semibold text-gray-800">{p.nom}</h4>
            <div className="flex items-start gap-2 text-sm text-gray-500">
              <MapPinIcon className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{p.address_raw}</span>
            </div>
            {p.lat && p.lng && (
              <span className="text-xs text-success">✓ Géocodé</span>
            )}
            {p.telephone && <p className="text-sm text-gray-600">{p.telephone}</p>}
            {p.access_info && (
              <p className="text-xs bg-yellow-50 text-yellow-700 px-3 py-1 rounded-lg">{p.access_info}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

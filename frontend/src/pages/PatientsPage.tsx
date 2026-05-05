import { useState, useEffect } from 'react';
import {
  PlusIcon,
  MapPinIcon,
  PencilIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import api from '../services/api';

const EMPTY_FORM = { nom: '', address_raw: '', telephone: '', access_info: '' };

export default function PatientsPage() {
  const [patients, setPatients] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId]     = useState<string | null>(null);
  const [form, setForm]         = useState(EMPTY_FORM);
  const [loading, setLoading]   = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [search, setSearch]     = useState('');

  const load = () =>
    api.get('/patients').then(({ data }) => setPatients(data)).catch(() => {});

  useEffect(() => { load(); }, []);

  const startEdit = (p: any) => {
    setEditId(p.id);
    setForm({ nom: p.nom, address_raw: p.address_raw, telephone: p.telephone || '', access_info: p.access_info || '' });
    setShowForm(false);
  };

  const cancelEdit = () => {
    setEditId(null);
    setForm(EMPTY_FORM);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/patients', form);
      setShowForm(false);
      setForm(EMPTY_FORM);
      load();
    } catch (e: any) {
      alert(e.response?.data?.message || 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (id: string) => {
    setLoading(true);
    try {
      await api.put(`/patients/${id}`, form);
      setEditId(null);
      setForm(EMPTY_FORM);
      load();
    } catch (e: any) {
      alert(e.response?.data?.message || 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, nom: string) => {
    if (!confirm(`Supprimer le patient ${nom} ?`)) return;
    setDeleting(id);
    try {
      await api.delete(`/patients/${id}`);
      load();
    } catch {
      alert('Erreur lors de la suppression');
    } finally {
      setDeleting(null);
    }
  };

  const filtered = patients.filter(p =>
    p.nom.toLowerCase().includes(search.toLowerCase()) ||
    p.address_raw.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Patients</h2>
          <p className="text-gray-500">{patients.length} patient(s) enregistré(s)</p>
        </div>
        <button onClick={() => { setShowForm(!showForm); setEditId(null); }} className="btn-primary">
          <PlusIcon className="w-5 h-5" />
          Nouveau patient
        </button>
      </div>

      {/* Barre de recherche */}
      {patients.length > 0 && (
        <input
          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-primary bg-white"
          placeholder="Rechercher un patient..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      )}

      {/* Formulaire création */}
      {showForm && (
        <div className="card">
          <h3 className="font-semibold mb-4">Ajouter un patient</h3>
          <form onSubmit={handleCreate} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <input
                className="px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-primary"
                placeholder="Nom complet *"
                value={form.nom}
                onChange={e => setForm({ ...form, nom: e.target.value })}
                required
              />
              <input
                className="px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-primary"
                placeholder="Téléphone"
                value={form.telephone}
                onChange={e => setForm({ ...form, telephone: e.target.value })}
              />
            </div>
            <input
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-primary"
              placeholder="Adresse complète * (géocodage automatique)"
              value={form.address_raw}
              onChange={e => setForm({ ...form, address_raw: e.target.value })}
              required
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
                {loading ? 'Géocodage...' : 'Enregistrer'}
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setForm(EMPTY_FORM); }}
                className="px-6 py-4 rounded-xl border border-gray-200 text-gray-600 hover:bg-neutral"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Liste */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(p => (
          <div key={p.id} className="card space-y-3">
            {editId === p.id ? (
              /* Mode édition inline */
              <div className="space-y-2">
                <input
                  className="w-full px-3 py-2 rounded-xl border border-primary focus:outline-none text-sm"
                  value={form.nom}
                  onChange={e => setForm({ ...form, nom: e.target.value })}
                  placeholder="Nom"
                />
                <input
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none text-sm"
                  value={form.address_raw}
                  onChange={e => setForm({ ...form, address_raw: e.target.value })}
                  placeholder="Adresse"
                />
                <input
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none text-sm"
                  value={form.telephone}
                  onChange={e => setForm({ ...form, telephone: e.target.value })}
                  placeholder="Téléphone"
                />
                <input
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none text-sm"
                  value={form.access_info}
                  onChange={e => setForm({ ...form, access_info: e.target.value })}
                  placeholder="Accès"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => handleUpdate(p.id)}
                    disabled={loading}
                    className="flex-1 flex items-center justify-center gap-2 bg-success text-white py-2 rounded-xl text-sm font-medium"
                  >
                    <CheckIcon className="w-4 h-4" /> Sauvegarder
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="flex-1 flex items-center justify-center gap-2 border border-gray-200 py-2 rounded-xl text-sm text-gray-600"
                  >
                    <XMarkIcon className="w-4 h-4" /> Annuler
                  </button>
                </div>
              </div>
            ) : (
              /* Mode affichage */
              <>
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-semibold text-gray-800">{p.nom}</h4>
                  <div className="flex gap-1 flex-shrink-0">
                    <button
                      onClick={() => startEdit(p)}
                      className="p-1.5 text-gray-300 hover:text-primary hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(p.id, p.nom)}
                      disabled={deleting === p.id}
                      className="p-1.5 text-gray-300 hover:text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex items-start gap-2 text-sm text-gray-500">
                  <MapPinIcon className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-300" />
                  <span>{p.address_raw}</span>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {p.lat && p.lng ? (
                    <span className="text-xs bg-green-50 text-success px-2 py-0.5 rounded-full font-medium">
                      ✓ Géolocalisé
                    </span>
                  ) : (
                    <span className="text-xs bg-yellow-50 text-yellow-600 px-2 py-0.5 rounded-full">
                      Non géolocalisé
                    </span>
                  )}
                  {p.telephone && (
                    <span className="text-xs text-gray-400">{p.telephone}</span>
                  )}
                </div>

                {p.access_info && (
                  <p className="text-xs bg-yellow-50 text-yellow-700 px-3 py-1.5 rounded-xl">
                    🔑 {p.access_info}
                  </p>
                )}
              </>
            )}
          </div>
        ))}
      </div>

      {filtered.length === 0 && patients.length > 0 && (
        <p className="text-center text-gray-400 py-8">Aucun patient trouvé pour "{search}"</p>
      )}

      {patients.length === 0 && (
        <div className="card text-center py-16">
          <MapPinIcon className="w-14 h-14 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400">Aucun patient enregistré</p>
        </div>
      )}
    </div>
  );
}

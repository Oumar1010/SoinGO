import { useState, useEffect } from 'react';
import {
  PlusIcon,
  TrashIcon,
  UserCircleIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import api from '../services/api';

const ROLE_LABELS: Record<string, { label: string; color: string }> = {
  ADMIN:         { label: 'Administrateur',  color: 'bg-purple-100 text-purple-700' },
  COORDO:        { label: 'Coordinateur',    color: 'bg-blue-100 text-primary' },
  AIDE_SOIGNANT: { label: 'Aide-soignant',   color: 'bg-green-100 text-success' },
};

const EMPTY_FORM = { nom: '', email: '', role: 'AIDE_SOIGNANT', password: '' };

export default function UsersPage() {
  const [users, setUsers]       = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState(EMPTY_FORM);
  const [loading, setLoading]   = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError]       = useState('');

  const load = () =>
    api.get('/users').then(({ data }) => setUsers(data)).catch(() => {});

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/users', form);
      setShowForm(false);
      setForm(EMPTY_FORM);
      load();
    } catch (e: any) {
      setError(e.response?.data?.message || 'Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, nom: string) => {
    if (!confirm(`Supprimer ${nom} ? Cette action est irréversible.`)) return;
    setDeleting(id);
    try {
      await api.delete(`/users/${id}`);
      load();
    } catch {
      alert('Erreur lors de la suppression');
    } finally {
      setDeleting(null);
    }
  };

  const byRole = (role: string) => users.filter(u => u.role === role);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Équipe</h2>
          <p className="text-gray-500">{users.length} membre(s)</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          <PlusIcon className="w-5 h-5" />
          Ajouter un membre
        </button>
      </div>

      {/* Formulaire création */}
      {showForm && (
        <div className="card">
          <h3 className="font-semibold mb-4">Nouveau membre</h3>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <input
                className="px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-primary"
                placeholder="Nom complet *"
                value={form.nom}
                onChange={e => setForm({ ...form, nom: e.target.value })}
                required
              />
              <input
                type="email"
                className="px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-primary"
                placeholder="Email *"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <select
                className="px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-primary"
                value={form.role}
                onChange={e => setForm({ ...form, role: e.target.value })}
              >
                <option value="AIDE_SOIGNANT">Aide-soignant</option>
                <option value="COORDO">Coordinateur</option>
                <option value="ADMIN">Administrateur</option>
              </select>
              <input
                type="password"
                className="px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-primary"
                placeholder="Mot de passe *"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                minLength={4}
                required
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <div className="flex gap-3">
              <button type="submit" disabled={loading} className="btn-primary">
                {loading ? 'Création...' : 'Créer le compte'}
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setError(''); setForm(EMPTY_FORM); }}
                className="px-6 py-4 rounded-xl border border-gray-200 text-gray-600 hover:bg-neutral"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Groupes par rôle */}
      {(['ADMIN', 'COORDO', 'AIDE_SOIGNANT'] as const).map(role => {
        const group = byRole(role);
        if (group.length === 0) return null;
        const { label, color } = ROLE_LABELS[role];
        return (
          <div key={role} className="space-y-3">
            <div className="flex items-center gap-2">
              <ShieldCheckIcon className="w-4 h-4 text-gray-400" />
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                {label}s ({group.length})
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {group.map(u => (
                <div key={u.id} className="card flex items-center gap-4">
                  <div className="bg-neutral rounded-full p-3 flex-shrink-0">
                    <UserCircleIcon className="w-8 h-8 text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 truncate">{u.nom}</p>
                    <p className="text-sm text-gray-500 truncate">{u.email}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${color}`}>
                      {label}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDelete(u.id, u.nom)}
                    disabled={deleting === u.id}
                    className="p-2 text-gray-300 hover:text-red-400 rounded-lg hover:bg-red-50 transition-colors flex-shrink-0"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {users.length === 0 && (
        <div className="card text-center py-16">
          <UserCircleIcon className="w-14 h-14 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400">Aucun membre dans l'équipe</p>
        </div>
      )}
    </div>
  );
}

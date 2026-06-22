import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Server, Edit2, Trash2, CheckCircle, XCircle, X, Loader2, Wifi, Lock, User, Globe } from 'lucide-react';
import apiClient from '../api/client';
import toast from 'react-hot-toast';

interface RouterData {
  id: string;
  name: string;
  ipAddress: string;
  apiPort: number;
  apiUser: string;
  status?: string;
}

interface RouterForm {
  name: string;
  ipAddress: string;
  apiPort: number;
  apiUser: string;
  apiPassword: string;
}

const defaultForm: RouterForm = { name: '', ipAddress: '', apiPort: 8728, apiUser: 'admin', apiPassword: '' };

export default function Routers() {
  const [routers, setRouters] = useState<RouterData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRouter, setEditingRouter] = useState<RouterData | null>(null);
  const [form, setForm] = useState<RouterForm>(defaultForm);
  const [submitting, setSubmitting] = useState(false);

  const fetchRouters = async () => {
    try {
      const res = await apiClient.get('/routers');
      if (res.data.success) setRouters(res.data.routers);
    } catch {
      toast.error('Erreur lors du chargement des routeurs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRouters(); }, []);

  const openCreate = () => {
    setEditingRouter(null);
    setForm(defaultForm);
    setShowModal(true);
  };

  const openEdit = (router: RouterData) => {
    setEditingRouter(router);
    setForm({
      name: router.name,
      ipAddress: router.ipAddress,
      apiPort: router.apiPort,
      apiUser: router.apiUser,
      apiPassword: '', // Never prefill passwords
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const isEdit = !!editingRouter;
    const toastId = toast.loading(isEdit ? 'Mise à jour du routeur...' : 'Connexion au routeur en cours...');
    try {
      const res = isEdit
        ? await apiClient.put(`/routers/${editingRouter!.id}`, form)
        : await apiClient.post('/routers', form);

      if (res.data.success) {
        toast.success(isEdit ? 'Routeur modifié !' : 'Routeur ajouté avec succès !', { id: toastId });
        setShowModal(false);
        setForm(defaultForm);
        setEditingRouter(null);
        fetchRouters();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erreur', { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Supprimer le routeur "${name}" ?\n⚠️ Tous les forfaits et l'historique associés seront supprimés.`)) return;
    const toastId = toast.loading('Suppression...');
    try {
      await apiClient.delete(`/routers/${id}`);
      toast.success('Routeur supprimé', { id: toastId });
      fetchRouters();
    } catch {
      toast.error('Erreur lors de la suppression', { id: toastId });
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Routeurs MikroTik</h1>
          <p className="text-slate-400 mt-1">Gérez vos équipements et points d'accès WiFi.</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Ajouter un routeur
        </button>
      </header>

      {!loading && routers.length === 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="glass-card p-16 flex flex-col items-center justify-center text-center gap-4">
          <div className="w-20 h-20 bg-brand-500/10 rounded-full flex items-center justify-center">
            <Server className="w-10 h-10 text-brand-500/50" />
          </div>
          <h3 className="text-xl font-bold text-white">Aucun routeur configuré</h3>
          <p className="text-slate-400 max-w-sm">Ajoutez votre premier routeur MikroTik pour commencer à gérer vos hotspots WiFi.</p>
          <button onClick={openCreate} className="btn-primary flex items-center gap-2 mt-2">
            <Plus className="w-5 h-5" /> Ajouter mon premier routeur
          </button>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {routers.map((router, index) => (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
            key={router.id}
            className="glass-card p-6 flex flex-col relative overflow-hidden group hover:border-brand-500/50 transition-colors"
          >
            <div className="absolute top-0 right-0 p-4">
              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                router.status === 'online'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
              }`}>
                {router.status === 'online'
                  ? <><CheckCircle className="w-3.5 h-3.5" /> En ligne</>
                  : <><XCircle className="w-3.5 h-3.5" /> Hors ligne</>}
              </div>
            </div>

            <div className="p-3 bg-slate-800/50 rounded-xl w-12 h-12 flex items-center justify-center mb-4 border border-dark-border">
              <Server className="text-brand-500 w-6 h-6" />
            </div>

            <h3 className="text-xl font-bold text-white">{router.name}</h3>
            <p className="text-slate-500 text-xs mt-1 font-mono truncate">{router.id}</p>

            <div className="mt-6 space-y-3 flex-1">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Adresse IP API</span>
                <span className="font-mono text-slate-300">{router.ipAddress}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Port API</span>
                <span className="text-slate-300 font-medium">{router.apiPort}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Utilisateur API</span>
                <span className="text-slate-300 font-mono">{router.apiUser}</span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-dark-border flex gap-2">
              <button
                onClick={() => openEdit(router)}
                className="flex-1 py-2 text-sm font-medium text-slate-300 bg-slate-800/50 hover:bg-slate-700 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Edit2 className="w-4 h-4" /> Modifier
              </button>
              <button onClick={() => handleDelete(router.id, router.name)}
                className="p-2 text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors border border-transparent hover:border-rose-500/20">
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ===== MODAL AJOUT / MODIFICATION ===== */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="glass-card w-full max-w-lg p-8 relative"
            >
              <div className="flex items-start justify-between mb-7">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-brand-500/20 rounded-xl flex items-center justify-center">
                    {editingRouter ? <Edit2 className="w-5 h-5 text-brand-400" /> : <Wifi className="w-5 h-5 text-brand-400" />}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">{editingRouter ? 'Modifier le Routeur' : 'Nouveau Routeur'}</h2>
                    <p className="text-slate-400 text-sm">{editingRouter ? `Édition de "${editingRouter.name}"` : 'Configurez la connexion API RouterOS'}</p>
                  </div>
                </div>
                <button onClick={() => setShowModal(false)}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-300">Nom du Hotspot</label>
                  <input type="text" required placeholder="Ex: Campus Principal"
                    value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="input-field" />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2 space-y-1.5">
                    <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                      <Globe className="w-4 h-4 text-slate-500" /> Adresse IP
                    </label>
                    <input type="text" required placeholder="192.168.88.1"
                      value={form.ipAddress} onChange={(e) => setForm({ ...form, ipAddress: e.target.value })}
                      className="input-field font-mono" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-300">Port API</label>
                    <input type="number" required placeholder="8728"
                      value={form.apiPort} onChange={(e) => setForm({ ...form, apiPort: parseInt(e.target.value) })}
                      className="input-field font-mono" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                      <User className="w-4 h-4 text-slate-500" /> Utilisateur API
                    </label>
                    <input type="text" required placeholder="admin"
                      value={form.apiUser} onChange={(e) => setForm({ ...form, apiUser: e.target.value })}
                      className="input-field" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                      <Lock className="w-4 h-4 text-slate-500" /> Mot de passe API
                    </label>
                    <input type="password" placeholder={editingRouter ? '(inchangé si vide)' : '••••••••'}
                      value={form.apiPassword} onChange={(e) => setForm({ ...form, apiPassword: e.target.value })}
                      className="input-field" />
                  </div>
                </div>

                {editingRouter && (
                  <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-lg text-xs text-amber-400">
                    🔒 Le mot de passe actuel sera conservé si vous laissez le champ vide.
                  </div>
                )}

                <div className="p-3 bg-brand-500/5 border border-brand-500/20 rounded-lg text-xs text-slate-400">
                  💡 <strong className="text-brand-400">Conseil :</strong> Activez l'API RouterOS sur votre Mikrotik via <span className="font-mono">IP → Services → api</span> et assurez-vous que le port 8728 est accessible.
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowModal(false)}
                    className="flex-1 py-2.5 text-sm font-medium text-slate-400 bg-slate-800/50 hover:bg-slate-700 rounded-lg transition-colors">
                    Annuler
                  </button>
                  <button type="submit" disabled={submitting}
                    className="flex-1 btn-primary flex items-center justify-center gap-2 py-2.5">
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : editingRouter ? <Edit2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    {submitting ? 'En cours...' : editingRouter ? 'Enregistrer' : 'Ajouter le routeur'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Clock, Tag, Zap, X, Loader2, Trash2, Wifi, Edit2 } from 'lucide-react';
import apiClient from '../api/client';
import toast from 'react-hot-toast';

interface Package {
  id: string;
  name: string;
  price: number;
  duration: number;
  profileName: string;
  routerId: string;
  router?: { name: string };
  _count?: { vouchers: number };
}

interface PackageForm {
  name: string;
  price: number | '';
  duration: number | '';
  profileName: string;
  routerId: string;
}

const defaultForm: PackageForm = { name: '', price: '', duration: '', profileName: '', routerId: '' };

const cardColors = [
  'from-brand-500/20 to-blue-500/10 border-brand-500/30',
  'from-emerald-500/20 to-teal-500/10 border-emerald-500/30',
  'from-purple-500/20 to-pink-500/10 border-purple-500/30',
  'from-orange-500/20 to-amber-500/10 border-orange-500/30',
];

export default function Packages() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [routers, setRouters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPkg, setEditingPkg] = useState<Package | null>(null);
  const [form, setForm] = useState<PackageForm>(defaultForm);
  const [submitting, setSubmitting] = useState(false);

  const fetchPackages = async () => {
    try {
      const [pkgRes, routersRes] = await Promise.all([
        apiClient.get('/tariffs'),
        apiClient.get('/routers'),
      ]);
      if (pkgRes.data.success) setPackages(pkgRes.data.tariffs);
      if (routersRes.data.success) setRouters(routersRes.data.routers);
    } catch {
      toast.error('Erreur lors du chargement des forfaits');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPackages(); }, []);

  const openCreate = () => {
    setEditingPkg(null);
    setForm(defaultForm);
    setShowModal(true);
  };

  const openEdit = (pkg: Package) => {
    setEditingPkg(pkg);
    setForm({
      name: pkg.name,
      price: pkg.price,
      duration: pkg.duration,
      profileName: pkg.profileName,
      routerId: pkg.routerId,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const isEdit = !!editingPkg;
    const toastId = toast.loading(isEdit ? 'Mise à jour du forfait...' : 'Création du forfait...');
    try {
      const payload = { ...form, price: Number(form.price), duration: Number(form.duration) };
      const res = isEdit
        ? await apiClient.put(`/tariffs/${editingPkg!.id}`, payload)
        : await apiClient.post('/tariffs', payload);

      if (res.data.success) {
        toast.success(isEdit ? 'Forfait modifié !' : 'Forfait créé !', { id: toastId });
        setShowModal(false);
        setForm(defaultForm);
        setEditingPkg(null);
        fetchPackages();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erreur', { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (pkg: Package) => {
    if (!confirm(`Supprimer le forfait "${pkg.name}" ?\nCette action est irréversible.`)) return;
    const toastId = toast.loading('Suppression...');
    try {
      await apiClient.delete(`/tariffs/${pkg.id}`);
      toast.success('Forfait supprimé', { id: toastId });
      fetchPackages();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erreur lors de la suppression', { id: toastId });
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Forfaits WiFi</h1>
          <p className="text-slate-400 mt-1">Configurez les offres et associez-les aux profils MikroTik.</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus className="w-5 h-5" /> Créer un forfait
        </button>
      </header>

      {!loading && packages.length === 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="glass-card p-16 flex flex-col items-center justify-center text-center gap-4">
          <div className="w-20 h-20 bg-brand-500/10 rounded-full flex items-center justify-center">
            <Wifi className="w-10 h-10 text-brand-500/50" />
          </div>
          <h3 className="text-xl font-bold text-white">Aucun forfait configuré</h3>
          <p className="text-slate-400 max-w-sm">Créez vos premiers forfaits WiFi pour commencer à vendre des tickets à vos clients.</p>
          <button onClick={openCreate} className="btn-primary flex items-center gap-2 mt-2">
            <Plus className="w-5 h-5" /> Créer mon premier forfait
          </button>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {packages.map((pkg, index) => (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            key={pkg.id}
            className={`relative p-6 rounded-2xl flex flex-col overflow-hidden group border bg-gradient-to-br ${cardColors[index % cardColors.length]}`}
          >
            <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-30 transition-opacity">
              <Zap className="w-20 h-20 -mr-6 -mt-6" />
            </div>

            <div className="mb-4">
              <span className="px-3 py-1 bg-white/10 text-white rounded-full text-sm font-bold border border-white/20">
                {pkg.price.toLocaleString()} FCFA
              </span>
            </div>

            <h3 className="text-xl font-bold text-white mb-2">{pkg.name}</h3>

            <div className="space-y-2 mt-4 flex-1">
              <div className="flex items-center gap-2 text-sm text-white/70">
                <Clock className="w-4 h-4" />
                <span>{pkg.duration < 60 ? `${pkg.duration} min` : `${Math.floor(pkg.duration / 60)}h${pkg.duration % 60 > 0 ? pkg.duration % 60 + 'min' : ''}`}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-white/70">
                <Tag className="w-4 h-4" />
                <span className="font-mono truncate">{pkg.profileName}</span>
              </div>
              {pkg.router && (
                <div className="flex items-center gap-2 text-sm text-white/70">
                  <Wifi className="w-4 h-4" />
                  <span className="truncate">{pkg.router.name}</span>
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-white/10 flex justify-between items-center">
              <span className="text-xs text-white/50">{pkg._count?.vouchers || 0} ventes</span>
              <div className="flex gap-2">
                <button
                  onClick={() => openEdit(pkg)}
                  className="text-white/70 hover:text-white text-sm font-medium transition-colors flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-white/10"
                >
                  <Edit2 className="w-3.5 h-3.5" /> Modifier
                </button>
                <button
                  onClick={() => handleDelete(pkg)}
                  className="text-rose-400/70 hover:text-rose-400 transition-colors p-1 rounded-lg hover:bg-rose-500/10"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ===== MODAL CRÉER / MODIFIER ===== */}
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
              className="glass-card w-full max-w-2xl p-8 relative"
            >
              <div className="flex items-start justify-between mb-7">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-brand-500/20 rounded-xl flex items-center justify-center">
                    {editingPkg ? <Edit2 className="w-5 h-5 text-brand-400" /> : <Zap className="w-5 h-5 text-brand-400" />}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">{editingPkg ? 'Modifier le Forfait' : 'Nouveau Forfait'}</h2>
                    <p className="text-slate-400 text-sm">{editingPkg ? `Édition de "${editingPkg.name}"` : 'Configurez le tarif et le profil MikroTik associé'}</p>
                  </div>
                </div>
                <button onClick={() => setShowModal(false)}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-5">
                    {!editingPkg && (
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-300">Routeur associé</label>
                        <select required value={form.routerId}
                          onChange={(e) => setForm({ ...form, routerId: e.target.value })}
                          className="input-field">
                          <option value="">-- Choisir un routeur --</option>
                          {routers.map((r) => (
                            <option key={r.id} value={r.id}>{r.name} ({r.ipAddress})</option>
                          ))}
                        </select>
                        {routers.length === 0 && (
                          <p className="text-xs text-amber-400">⚠️ Aucun routeur configuré. Ajoutez-en un d'abord.</p>
                        )}
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-300">Nom du forfait</label>
                      <input type="text" required placeholder="Ex: Pass 2 Heures"
                        value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                        className="input-field" />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-300">Prix (FCFA)</label>
                        <input type="number" required min="1" placeholder="500"
                          value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value ? Number(e.target.value) : '' })}
                          className="input-field" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-300">Durée (minutes)</label>
                        <input type="number" required min="1" placeholder="120"
                          value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value ? Number(e.target.value) : '' })}
                          className="input-field" />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-300">Profil MikroTik</label>
                      <input type="text" required placeholder="Ex: 2H_Profile"
                        value={form.profileName} onChange={(e) => setForm({ ...form, profileName: e.target.value })}
                        className="input-field font-mono" />
                      <p className="text-xs text-slate-500">Doit correspondre exactement au nom du profil Hotspot dans RouterOS</p>
                    </div>
                  </div>

                  {/* Aperçu live */}
                  <div className="flex flex-col">
                    <p className="text-sm font-medium text-slate-400 mb-4">Aperçu carte client</p>
                    <motion.div
                      animate={{ scale: form.name ? 1 : 0.95, opacity: form.name ? 1 : 0.4 }}
                      className="flex-1 rounded-2xl bg-gradient-to-br from-brand-500/30 to-blue-500/20 border border-brand-500/30 p-6 flex flex-col justify-between relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 opacity-10">
                        <Zap className="w-32 h-32 -mr-8 -mt-8" />
                      </div>
                      <div>
                        <span className="px-3 py-1 bg-white/15 text-white rounded-full text-sm font-bold border border-white/20">
                          {form.price ? `${Number(form.price).toLocaleString()} FCFA` : 'Prix FCFA'}
                        </span>
                        <h3 className="text-2xl font-bold text-white mt-4">{form.name || 'Nom du forfait'}</h3>
                      </div>
                      <div className="space-y-2 mt-4">
                        <div className="flex items-center gap-2 text-sm text-white/70">
                          <Clock className="w-4 h-4" />
                          <span>
                            {form.duration
                              ? Number(form.duration) < 60
                                ? `${form.duration} minutes`
                                : `${Math.floor(Number(form.duration) / 60)}h${Number(form.duration) % 60 > 0 ? ` ${Number(form.duration) % 60}min` : ''}`
                              : 'Durée'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-white/70">
                          <Tag className="w-4 h-4" />
                          <span className="font-mono">{form.profileName || 'Profil MikroTik'}</span>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                </div>

                <div className="flex gap-3 mt-7 pt-6 border-t border-dark-border">
                  <button type="button" onClick={() => setShowModal(false)}
                    className="flex-1 py-2.5 text-sm font-medium text-slate-400 bg-slate-800/50 hover:bg-slate-700 rounded-lg transition-colors">
                    Annuler
                  </button>
                  <button type="submit" disabled={submitting || (!editingPkg && routers.length === 0)}
                    className="flex-1 btn-primary flex items-center justify-center gap-2 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed">
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : editingPkg ? <Edit2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    {submitting ? 'En cours...' : editingPkg ? 'Enregistrer les modifications' : 'Créer le forfait'}
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

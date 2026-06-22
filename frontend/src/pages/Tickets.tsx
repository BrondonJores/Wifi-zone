import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Printer, Key, Plus, X, Loader2, Trash2,
  CheckCircle, Clock, AlertCircle, Ticket, Search, Copy, ChevronDown
} from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../api/client';

interface Voucher {
  id: string;
  code: string;
  status: string;
  createdAt: string;
  tariff?: { name: string; price: number; router?: { name: string } };
  transaction?: { phoneNumber: string };
}

interface Tariff {
  id: string;
  name: string;
  price: number;
  duration: number;
  profileName: string;
  router?: { name: string };
}

export default function Tickets() {
  const [tickets, setTickets] = useState<Voucher[]>([]);
  const [tariffs, setTariffs] = useState<Tariff[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [filter, setFilter] = useState<'ALL' | 'UNUSED' | 'ACTIVE' | 'EXPIRED'>('ALL');
  const [search, setSearch] = useState('');
  const [genForm, setGenForm] = useState({ tariffId: '', quantity: 10 });
  const [generatedCodes, setGeneratedCodes] = useState<string[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const fetchAll = async () => {
    try {
      const [vRes, tRes] = await Promise.all([
        apiClient.get('/vouchers'),
        apiClient.get('/tariffs'),
      ]);
      if (vRes.data.success) setTickets(vRes.data.vouchers);
      if (tRes.data.success) setTariffs(tRes.data.tariffs);
    } catch {
      toast.error('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    const toastId = toast.loading(`Génération de ${genForm.quantity} tickets...`);
    try {
      const res = await apiClient.post('/vouchers/batch', genForm);
      if (res.data.success) {
        toast.success(res.data.message, { id: toastId });
        setShowModal(false);
        setGeneratedCodes([]);
        setShowSuccess(false);
        fetchAll();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erreur de génération', { id: toastId });
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce ticket ?')) return;
    try {
      await apiClient.delete(`/vouchers/${id}`);
      toast.success('Ticket supprimé');
      fetchAll();
    } catch {
      toast.error('Erreur lors de la suppression');
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success(`Code ${code} copié !`, { icon: '📋' });
  };

  const handlePrint = () => {
    window.print();
    toast('Impression lancée', { icon: '🖨️' });
  };

  const statusBadge = (status: string) => {
    const s = status.toUpperCase();
    if (s === 'UNUSED') return (
      <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-medium">
        <Clock className="w-3 h-3" /> Non utilisé
      </span>
    );
    if (s === 'ACTIVE') return (
      <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-medium">
        <CheckCircle className="w-3 h-3" /> Actif
      </span>
    );
    if (s === 'EXPIRED') return (
      <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-500/10 text-slate-400 border border-slate-500/20 text-xs font-medium">
        <AlertCircle className="w-3 h-3" /> Expiré
      </span>
    );
    return null;
  };

  const filtered = tickets.filter(t => {
    const matchStatus = filter === 'ALL' || t.status === filter;
    const matchSearch = !search || t.code.includes(search) || t.transaction?.phoneNumber?.includes(search);
    return matchStatus && matchSearch;
  });

  const stats = {
    total: tickets.length,
    unused: tickets.filter(t => t.status === 'UNUSED').length,
    active: tickets.filter(t => t.status === 'ACTIVE').length,
    expired: tickets.filter(t => t.status === 'EXPIRED').length,
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Gestion des Tickets</h1>
          <p className="text-slate-400 mt-1">Supervisez et générez les codes d'accès WiFi.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handlePrint}
            className="px-4 py-2 rounded-lg bg-dark-bg border border-dark-border text-slate-300 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-2 text-sm">
            <Printer className="w-4 h-4" /> Imprimer
          </button>
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-5 h-5" /> Générer des tickets
          </button>
        </div>
      </header>

      {/* Stats rapides */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: stats.total, color: 'text-white', bg: 'bg-slate-800/50', icon: Ticket },
          { label: 'Non utilisés', value: stats.unused, color: 'text-blue-400', bg: 'bg-blue-500/5 border border-blue-500/20', icon: Clock },
          { label: 'Actifs', value: stats.active, color: 'text-emerald-400', bg: 'bg-emerald-500/5 border border-emerald-500/20', icon: CheckCircle },
          { label: 'Expirés', value: stats.expired, color: 'text-slate-400', bg: 'bg-slate-500/5 border border-slate-500/20', icon: AlertCircle },
        ].map((s) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className={`glass-card p-4 flex items-center gap-3 cursor-pointer hover:border-brand-500/30 transition-colors ${s.bg}`}>
            <div className={`p-2 rounded-lg bg-slate-800/50 ${s.color}`}>
              <s.icon className="w-5 h-5" />
            </div>
            <div>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-slate-500">{s.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Filtres + Recherche */}
      <div className="flex flex-col md:flex-row gap-3 items-center">
        {/* Filtre statut */}
        <div className="flex rounded-xl overflow-hidden border border-dark-border bg-dark-bg/50 p-1 gap-1">
          {(['ALL', 'UNUSED', 'ACTIVE', 'EXPIRED'] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${filter === f ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-white'}`}>
              {f === 'ALL' ? 'Tous' : f === 'UNUSED' ? 'Non utilisés' : f === 'ACTIVE' ? 'Actifs' : 'Expirés'}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text" placeholder="Code, numéro de tél..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-dark-bg border border-dark-border rounded-lg pl-9 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500"
          />
        </div>

        <p className="text-sm text-slate-500 ml-auto">{filtered.length} résultat{filtered.length > 1 ? 's' : ''}</p>
      </div>

      {/* Table des tickets */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="glass-card overflow-hidden" ref={printRef}>
        {!loading && filtered.length === 0 ? (
          <div className="py-20 text-center">
            <Ticket className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-400">Aucun ticket trouvé</h3>
            <p className="text-slate-500 text-sm mt-1">Générez vos premiers tickets ou ajustez le filtre</p>
            <button onClick={() => setShowModal(true)} className="btn-primary mt-4 flex items-center gap-2 mx-auto">
              <Plus className="w-4 h-4" /> Générer maintenant
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-dark-border bg-slate-900/50">
                  <th className="p-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Code PIN</th>
                  <th className="p-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Forfait</th>
                  <th className="p-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Routeur</th>
                  <th className="p-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Tél. Client</th>
                  <th className="p-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Créé le</th>
                  <th className="p-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Statut</th>
                  <th className="p-4 text-xs font-medium text-slate-400 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-border">
                {filtered.map((ticket) => (
                  <motion.tr key={ticket.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="hover:bg-slate-800/30 transition-colors group">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xl font-bold text-white tracking-[0.2em]">{ticket.code}</span>
                        <button onClick={() => copyCode(ticket.code)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-slate-500 hover:text-brand-400">
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-slate-300">
                      {ticket.tariff?.name || '—'}
                      {ticket.tariff?.price && (
                        <span className="ml-2 text-xs text-brand-400 font-semibold">{ticket.tariff.price} FCFA</span>
                      )}
                    </td>
                    <td className="p-4 text-sm text-slate-400">{ticket.tariff?.router?.name || '—'}</td>
                    <td className="p-4 text-sm text-slate-400 font-mono">{ticket.transaction?.phoneNumber || '—'}</td>
                    <td className="p-4 text-sm text-slate-400">
                      {new Date(ticket.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="p-4">{statusBadge(ticket.status)}</td>
                    <td className="p-4 text-right">
                      <button onClick={() => handleDelete(ticket.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 text-rose-400/70 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* ===== MODAL GÉNÉRATION PAR LOT ===== */}
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
              {/* Header */}
              <div className="flex items-start justify-between mb-7">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-brand-500/20 rounded-xl flex items-center justify-center">
                    <Key className="w-5 h-5 text-brand-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Générer des tickets</h2>
                    <p className="text-slate-400 text-sm">Création de codes PIN en lot</p>
                  </div>
                </div>
                <button onClick={() => setShowModal(false)}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleGenerate} className="space-y-5">
                {/* Forfait */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-300">Forfait cible</label>
                  <div className="relative">
                    <select required value={genForm.tariffId}
                      onChange={(e) => setGenForm({ ...genForm, tariffId: e.target.value })}
                      className="input-field appearance-none pr-9 cursor-pointer">
                      <option value="">-- Sélectionner un forfait --</option>
                      {tariffs.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} — {t.price} FCFA {t.router ? `(${t.router.name})` : ''}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                  {tariffs.length === 0 && (
                    <p className="text-xs text-amber-400">⚠️ Aucun forfait disponible. Créez-en un d'abord.</p>
                  )}
                </div>

                {/* Quantité avec slider */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium text-slate-300">Quantité</label>
                    <span className="text-2xl font-bold text-brand-400">{genForm.quantity}</span>
                  </div>
                  <input type="range" min={1} max={200} step={1}
                    value={genForm.quantity}
                    onChange={(e) => setGenForm({ ...genForm, quantity: parseInt(e.target.value) })}
                    className="w-full h-2 bg-slate-700 rounded-full appearance-none cursor-pointer accent-brand-500"
                  />
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>1</span><span>50</span><span>100</span><span>200</span>
                  </div>
                  {/* Presets rapides */}
                  <div className="flex gap-2 mt-2">
                    {[5, 10, 25, 50, 100].map((n) => (
                      <button key={n} type="button"
                        onClick={() => setGenForm({ ...genForm, quantity: n })}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          genForm.quantity === n ? 'bg-brand-500 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                        }`}>
                        {n}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Info résumé */}
                {genForm.tariffId && (
                  <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-xl bg-brand-500/5 border border-brand-500/20">
                    {(() => {
                      const t = tariffs.find(t => t.id === genForm.tariffId);
                      if (!t) return null;
                      return (
                        <div className="flex justify-between items-center text-sm">
                          <div>
                            <p className="font-semibold text-white">{genForm.quantity} × {t.name}</p>
                            <p className="text-slate-400 text-xs mt-0.5">Profil MikroTik : <span className="font-mono text-brand-400">{t.profileName}</span></p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-white">{(t.price * genForm.quantity).toLocaleString()} FCFA</p>
                            <p className="text-xs text-slate-400">Valeur totale</p>
                          </div>
                        </div>
                      );
                    })()}
                  </motion.div>
                )}

                {/* Boutons */}
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowModal(false)}
                    className="flex-1 py-2.5 text-sm font-medium text-slate-400 bg-slate-800/50 hover:bg-slate-700 rounded-lg transition-colors">
                    Annuler
                  </button>
                  <button type="submit" disabled={generating || tariffs.length === 0}
                    className="flex-1 btn-primary flex items-center justify-center gap-2 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed">
                    {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
                    {generating ? 'Génération...' : `Générer ${genForm.quantity} tickets`}
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

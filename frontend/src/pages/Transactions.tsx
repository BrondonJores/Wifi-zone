import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Search, Download, CheckCircle2, XCircle, Clock,
  TrendingUp, DollarSign, Phone, Calendar, RefreshCw
} from 'lucide-react';
import apiClient from '../api/client';
import toast from 'react-hot-toast';

interface Transaction {
  id: string;
  paymentRef: string;
  phoneNumber: string;
  amount: number;
  status: string;
  createdAt: string;
  router?: { name: string };
  voucher?: { code: string; tariff?: { name: string } };
}

export default function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'SUCCESS' | 'PENDING' | 'PROCESSING' | 'FAILED'>('ALL');

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/transactions');
      if (res.data.success) setTransactions(res.data.transactions);
    } catch {
      toast.error('Erreur lors du chargement des transactions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTransactions(); }, []);

  const handleVerify = async (ref: string) => {
    const toastId = toast.loading('Vérification auprès de Monetbil...');
    try {
      const res = await apiClient.get(`/payments/status/${ref}`);
      if (res.data.status === 'SUCCESS') {
        toast.success('Paiement confirmé !', { id: toastId });
        fetchTransactions();
      } else {
        toast('Paiement toujours en attente', { id: toastId, icon: '⏳' });
      }
    } catch {
      toast.error('Erreur de vérification', { id: toastId });
    }
  };

  const handleExportCSV = () => {
    const rows = [
      ['Référence', 'Téléphone', 'Forfait', 'Montant (FCFA)', 'Routeur', 'Statut', 'Date'],
      ...filtered.map(t => [
        t.paymentRef,
        t.phoneNumber,
        t.voucher?.tariff?.name || '—',
        t.amount,
        t.router?.name || '—',
        t.status,
        new Date(t.createdAt).toLocaleDateString('fr-FR'),
      ])
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast.success('Export CSV téléchargé !');
  };

  const statusBadge = (status: string) => {
    const s = status.toUpperCase();
    if (s === 'SUCCESS') return (
      <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-medium">
        <CheckCircle2 className="w-3 h-3" /> Succès
      </span>
    );
    if (s === 'PROCESSING') return (
      <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-medium">
        <RefreshCw className="w-3 h-3 animate-spin" /> En cours…
      </span>
    );
    if (s === 'PENDING') return (
      <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-medium">
        <Clock className="w-3 h-3" /> En attente
      </span>
    );
    if (s === 'FAILED' || s === 'CANCELLED') return (
      <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs font-medium">
        <XCircle className="w-3 h-3" /> Échoué
      </span>
    );
    return null;
  };

  const filtered = transactions.filter(t => {
    const matchStatus = filterStatus === 'ALL' || t.status.toUpperCase() === filterStatus;
    const matchSearch = !search || t.phoneNumber.includes(search) || t.paymentRef.includes(search) || t.voucher?.tariff?.name?.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  // KPIs
  const totalSuccess = transactions.filter(t => t.status.toUpperCase() === 'SUCCESS');
  const revenue = totalSuccess.reduce((sum, t) => sum + t.amount, 0);
  const pending = transactions.filter(t => ['PENDING', 'PROCESSING'].includes(t.status.toUpperCase())).length;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Transactions</h1>
          <p className="text-slate-400 mt-1">Historique des paiements Mobile Money via Monetbil.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={fetchTransactions}
            className="p-2.5 rounded-lg bg-dark-bg border border-dark-border text-slate-400 hover:text-white transition-colors">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={handleExportCSV}
            className="px-4 py-2 rounded-lg bg-dark-bg border border-dark-border text-slate-300 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-2 text-sm">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="glass-card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
            <DollarSign className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <p className="text-slate-400 text-sm">Revenus totaux</p>
            <p className="text-2xl font-bold text-white">{revenue.toLocaleString()} <span className="text-sm text-slate-400 font-normal">FCFA</span></p>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="glass-card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-6 h-6 text-brand-400" />
          </div>
          <div>
            <p className="text-slate-400 text-sm">Paiements réussis</p>
            <p className="text-2xl font-bold text-white">{totalSuccess.length} <span className="text-sm text-slate-400 font-normal">/ {transactions.length}</span></p>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="glass-card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
            <Clock className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <p className="text-slate-400 text-sm">En attente</p>
            <p className="text-2xl font-bold text-white">{pending} <span className="text-sm text-slate-400 font-normal">paiement{pending > 1 ? 's' : ''}</span></p>
          </div>
        </motion.div>
      </div>

      {/* Filtres */}
      <div className="flex flex-col md:flex-row gap-3 items-center">
        <div className="flex rounded-xl overflow-hidden border border-dark-border bg-dark-bg/50 p-1 gap-1">
          {(['ALL', 'SUCCESS', 'PENDING', 'PROCESSING', 'FAILED'] as const).map((s) => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${filterStatus === s ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-white'}`}>
              {s === 'ALL' ? 'Toutes' : s === 'SUCCESS' ? 'Succès' : s === 'PENDING' ? 'En attente' : s === 'PROCESSING' ? 'En cours' : 'Échouées'}
            </button>
          ))}
        </div>

        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input type="text" placeholder="Tél, référence, forfait..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-dark-bg border border-dark-border rounded-lg pl-9 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500"
          />
        </div>
        <p className="text-sm text-slate-500 ml-auto">{filtered.length} transaction{filtered.length > 1 ? 's' : ''}</p>
      </div>

      {/* Table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="glass-card overflow-hidden">
        {!loading && filtered.length === 0 ? (
          <div className="py-20 text-center">
            <DollarSign className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-400">Aucune transaction</h3>
            <p className="text-slate-500 text-sm mt-1">Les paiements Monetbil apparaîtront ici automatiquement.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-dark-border bg-slate-900/50">
                  <th className="p-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Référence</th>
                  <th className="p-4 text-xs font-medium text-slate-400 uppercase tracking-wider">
                    <Phone className="w-3 h-3 inline mr-1" /> Numéro
                  </th>
                  <th className="p-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Forfait</th>
                  <th className="p-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Code PIN</th>
                  <th className="p-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Montant</th>
                  <th className="p-4 text-xs font-medium text-slate-400 uppercase tracking-wider">
                    <Calendar className="w-3 h-3 inline mr-1" /> Date
                  </th>
                  <th className="p-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Statut</th>
                  <th className="p-4 text-xs font-medium text-slate-400 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-border">
                {filtered.map((txn, index) => (
                  <motion.tr key={txn.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.02 }}
                    className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-4 font-mono text-xs text-brand-400">{txn.paymentRef.substring(0, 12)}...</td>
                    <td className="p-4 text-sm text-slate-200 font-medium">{txn.phoneNumber}</td>
                    <td className="p-4 text-sm text-slate-300">{txn.voucher?.tariff?.name || '—'}</td>
                    <td className="p-4 font-mono text-sm font-bold text-white tracking-widest">
                      {txn.voucher?.code || '—'}
                    </td>
                    <td className="p-4">
                      <span className="text-sm font-bold text-white">{txn.amount.toLocaleString()}</span>
                      <span className="text-xs text-slate-400 ml-1">FCFA</span>
                    </td>
                    <td className="p-4 text-sm text-slate-400">
                      {new Date(txn.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="p-4">{statusBadge(txn.status)}</td>
                    <td className="p-4 text-right">
                      {['PENDING', 'PROCESSING'].includes(txn.status.toUpperCase()) && (
                        <button onClick={() => handleVerify(txn.paymentRef)}
                          className="text-xs font-medium text-brand-400 hover:text-brand-300 transition-colors border border-brand-500/20 px-3 py-1.5 rounded-lg hover:bg-brand-500/5">
                          Vérifier
                        </button>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {filtered.length > 0 && (
          <div className="p-4 border-t border-dark-border flex items-center justify-between text-sm text-slate-400">
            <span>{filtered.length} transaction{filtered.length > 1 ? 's' : ''} affichée{filtered.length > 1 ? 's' : ''}</span>
            <span className="text-emerald-400 font-semibold">{revenue.toLocaleString()} FCFA encaissés</span>
          </div>
        )}
      </motion.div>
    </div>
  );
}

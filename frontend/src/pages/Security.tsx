import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Shield, CheckCircle2, XCircle, AlertTriangle, Clock,
  Search, RefreshCw, Globe, Hash, FileText
} from 'lucide-react';
import apiClient from '../api/client';
import toast from 'react-hot-toast';

interface AuditLog {
  id: string;
  paymentRef: string | null;
  status: string;
  amount: number | null;
  ipAddress: string | null;
  signatureValid: boolean;
  errorMessage: string | null;
  createdAt: string;
}

export default function Security() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/stats/audit-logs');
      if (res.data.success) setLogs(res.data.logs);
    } catch {
      toast.error('Erreur lors du chargement des logs de sécurité');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLogs(); }, []);

  const filtered = logs.filter(log => {
    if (!search) return true;
    return (
      log.ipAddress?.includes(search) ||
      log.paymentRef?.includes(search) ||
      log.status.toLowerCase().includes(search.toLowerCase())
    );
  });

  const fraudAttempts = logs.filter(l => !l.signatureValid).length;
  const validWebhooks = logs.filter(l => l.signatureValid).length;
  const successPayments = logs.filter(l => l.signatureValid && l.status === 'success').length;

  const statusBadge = (log: AuditLog) => {
    if (!log.signatureValid) return (
      <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs font-medium">
        <XCircle className="w-3 h-3" /> Signature invalide
      </span>
    );
    if (log.status === 'success') return (
      <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-medium">
        <CheckCircle2 className="w-3 h-3" /> Succès
      </span>
    );
    if (log.status === 'failed' || log.status === 'cancelled') return (
      <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-medium">
        <AlertTriangle className="w-3 h-3" /> Échoué / Annulé
      </span>
    );
    return (
      <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-500/10 text-slate-400 border border-slate-500/20 text-xs font-medium">
        <Clock className="w-3 h-3" /> {log.status}
      </span>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <Shield className="w-8 h-8 text-brand-400" />
            Journal de Sécurité
          </h1>
          <p className="text-slate-400 mt-1">Audit complet de toutes les requêtes Webhook reçues — y compris les tentatives de fraude.</p>
        </div>
        <button onClick={fetchLogs}
          className="p-2.5 rounded-lg bg-dark-bg border border-dark-border text-slate-400 hover:text-white transition-colors">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="glass-card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <p className="text-slate-400 text-sm">Webhooks valides</p>
            <p className="text-2xl font-bold text-white">{validWebhooks} <span className="text-sm text-slate-400 font-normal">/ {logs.length}</span></p>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="glass-card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center flex-shrink-0">
            <XCircle className="w-6 h-6 text-rose-400" />
          </div>
          <div>
            <p className="text-slate-400 text-sm">Tentatives de fraude bloquées</p>
            <p className="text-2xl font-bold text-white">{fraudAttempts}</p>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="glass-card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center flex-shrink-0">
            <Shield className="w-6 h-6 text-brand-400" />
          </div>
          <div>
            <p className="text-slate-400 text-sm">Paiements validés</p>
            <p className="text-2xl font-bold text-white">{successPayments}</p>
          </div>
        </motion.div>
      </div>

      {/* Search */}
      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input type="text" placeholder="IP, référence, statut..."
          value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-dark-bg border border-dark-border rounded-lg pl-9 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500" />
      </div>

      {/* Table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="glass-card overflow-hidden">
        {!loading && filtered.length === 0 ? (
          <div className="py-20 text-center">
            <Shield className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-400">Aucun log</h3>
            <p className="text-slate-500 text-sm mt-1">Les appels Webhook Monetbil apparaîtront ici automatiquement.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-dark-border bg-slate-900/50">
                  <th className="p-4 text-xs font-medium text-slate-400 uppercase tracking-wider">
                    <Globe className="w-3 h-3 inline mr-1" /> Adresse IP
                  </th>
                  <th className="p-4 text-xs font-medium text-slate-400 uppercase tracking-wider">
                    <Hash className="w-3 h-3 inline mr-1" /> Référence
                  </th>
                  <th className="p-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Montant</th>
                  <th className="p-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Statut</th>
                  <th className="p-4 text-xs font-medium text-slate-400 uppercase tracking-wider">
                    <FileText className="w-3 h-3 inline mr-1" /> Message
                  </th>
                  <th className="p-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-border">
                {filtered.map((log, index) => (
                  <motion.tr key={log.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.02 }}
                    className={`transition-colors ${!log.signatureValid ? 'bg-rose-500/5 hover:bg-rose-500/10' : 'hover:bg-slate-800/30'}`}>
                    <td className="p-4 font-mono text-xs text-slate-300">
                      {log.ipAddress || '—'}
                    </td>
                    <td className="p-4 font-mono text-xs text-brand-400">
                      {log.paymentRef ? log.paymentRef.substring(0, 12) + '...' : '—'}
                    </td>
                    <td className="p-4 text-sm text-slate-300">
                      {log.amount != null ? `${log.amount.toLocaleString()} FCFA` : '—'}
                    </td>
                    <td className="p-4">{statusBadge(log)}</td>
                    <td className="p-4 text-xs text-slate-500 max-w-xs truncate">
                      {log.errorMessage || <span className="text-emerald-500/60">OK</span>}
                    </td>
                    <td className="p-4 text-sm text-slate-400">
                      {new Date(log.createdAt).toLocaleDateString('fr-FR', {
                        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                      })}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {filtered.length > 0 && (
          <div className="p-4 border-t border-dark-border text-sm text-slate-500">
            {filtered.length} entrée{filtered.length > 1 ? 's' : ''} — {fraudAttempts > 0
              ? <span className="text-rose-400 font-semibold">{fraudAttempts} tentative{fraudAttempts > 1 ? 's' : ''} de fraude détectée{fraudAttempts > 1 ? 's' : ''}</span>
              : <span className="text-emerald-400">Aucune fraude détectée ✓</span>
            }
          </div>
        )}
      </motion.div>
    </div>
  );
}

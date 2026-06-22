import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, Users, Ticket, Activity, Download, Loader2 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import apiClient from '../api/client';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const res = await apiClient.get('/stats/dashboard');
      if (res.data.success) {
        setData(res.data.stats);
      }
    } catch (error) {
      toast.error('Erreur lors du chargement des statistiques');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleExport = () => {
    if (!data) return;
    
    // Création du contenu CSV
    let csvContent = "--- RAPPORT WIFI ZONE ---\n\n";
    csvContent += `Revenus Aujourd'hui : ${data.todayRevenue} FCFA\n`;
    csvContent += `Tickets Actifs : ${data.activeTicketsCount}\n`;
    csvContent += `Routeurs Actifs : ${data.routersCount}\n\n`;

    csvContent += "--- DERNIERS TICKETS ---\n";
    csvContent += "Code,Forfait,Date\n";
    data.recentTickets.forEach((t: any) => {
      csvContent += `${t.code},${t.tariff?.name || 'Inconnu'},${new Date(t.createdAt).toLocaleString()}\n`;
    });

    csvContent += "\n--- EVOLUTION DES VENTES (7 JOURS) ---\n";
    csvContent += "Jour,Revenus (FCFA)\n";
    data.salesData.forEach((s: any) => {
      csvContent += `${s.name},${s.revenus}\n`;
    });

    // Téléchargement
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `rapport_wifi_zone_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Rapport exporté avec succès !');
  };

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <Loader2 className="w-10 h-10 animate-spin text-brand-500" />
      </div>
    );
  }

  const stats = [
    { title: "Revenus (Aujourd'hui)", value: `${data.todayRevenue.toLocaleString()} FCFA`, change: "Aujourd'hui", icon: ArrowUpRight, color: "text-brand-500" },
    { title: "Tickets Actifs", value: data.activeTicketsCount.toString(), change: "En temps réel", icon: Ticket, color: "text-blue-500" },
    { title: "Utilisateurs", value: data.connectedUsers.toString(), change: "Estimation", icon: Users, color: "text-emerald-500" },
    { title: "Routeurs Actifs", value: data.routersCount.toString(), change: "En ligne", icon: Activity, color: "text-purple-500" },
  ];

  return (
    <div className="flex flex-col gap-8">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Vue d'ensemble</h1>
          <p className="text-slate-400 mt-1">Gérez vos hotspots et vos ventes en temps réel.</p>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={handleExport}>
          <Download className="w-4 h-4" />
          Exporter le rapport
        </button>
      </header>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="glass-card p-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-slate-800/50 rounded-full blur-3xl -mr-10 -mt-10 transition-colors group-hover:bg-brand-500/10"></div>
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-lg bg-dark-bg/80 border border-dark-border ${stat.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <span className={`text-xs font-medium text-slate-500`}>
                  {stat.change}
                </span>
              </div>
              <h3 className="text-slate-400 font-medium mb-1">{stat.title}</h3>
              <p className="text-3xl font-bold text-white">{stat.value}</p>
            </div>
          );
        })}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card p-6 min-h-[400px] flex flex-col">
          <h3 className="text-xl font-bold text-white mb-6">Évolution des ventes (7 derniers jours)</h3>
          <div className="flex-1 w-full h-full min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.salesData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenus" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '0.5rem', color: '#f8fafc' }}
                  itemStyle={{ color: '#a78bfa' }}
                />
                <Area type="monotone" dataKey="revenus" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenus)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="glass-card p-6 flex flex-col">
          <h3 className="text-xl font-bold text-white mb-6">Derniers Tickets</h3>
          <div className="flex-1 flex flex-col gap-4">
            {data.recentTickets.length === 0 ? (
              <p className="text-slate-500 text-center py-4">Aucun ticket récent</p>
            ) : (
              data.recentTickets.map((ticket: any) => (
                <div key={ticket.id} className="flex justify-between items-center p-3 rounded-lg bg-dark-bg/50 border border-dark-border">
                  <div>
                    <p className="font-mono text-brand-400">#{ticket.code}</p>
                    <p className="text-xs text-slate-500">{new Date(ticket.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full border ${
                    ticket.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                    ticket.status === 'UNUSED' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 
                    'bg-rose-500/10 text-rose-400 border-rose-500/20'
                  }`}>
                    {ticket.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

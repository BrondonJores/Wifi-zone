import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Wifi, BarChart3, Settings, ShieldCheck } from 'lucide-react';
import Login from './pages/Login';

function DashboardLayout() {
  return (
    <div className="min-h-screen bg-dark-bg text-slate-200 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-dark-card border-r border-dark-border p-6 flex flex-col gap-6">
        <div className="flex items-center gap-3 text-brand-500">
          <Wifi className="w-8 h-8" />
          <span className="text-xl font-bold text-white tracking-wide">WiFi SaaS</span>
        </div>
        
        <nav className="flex flex-col gap-2 mt-8">
          <Link to="/" className="flex items-center gap-3 p-3 rounded-lg bg-brand-600/10 text-brand-500 font-medium transition-colors">
            <BarChart3 className="w-5 h-5" />
            Tableau de bord
          </Link>
          <Link to="/routers" className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors">
            <Settings className="w-5 h-5" />
            Routeurs MikroTik
          </Link>
        </nav>

        <div className="mt-auto p-4 bg-slate-900/50 rounded-xl border border-dark-border/50 flex items-center gap-3">
          <ShieldCheck className="text-brand-500 w-5 h-5" />
          <div className="text-xs">
            <p className="font-semibold text-slate-300">Sécurité Active</p>
            <p className="text-slate-500">Connexion chiffrée</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="mb-10 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Vue d'ensemble</h1>
            <p className="text-slate-400 mt-1">Gérez vos hotspots et vos ventes en temps réel.</p>
          </div>
          <button className="btn-primary">
            + Nouveau Forfait
          </button>
        </header>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {/* Stat Card 1 */}
          <div className="glass-card p-6">
            <h3 className="text-slate-400 font-medium mb-2">Revenus du jour</h3>
            <p className="text-4xl font-bold text-white">45,000 <span className="text-lg text-brand-500">FCFA</span></p>
            <p className="text-sm text-emerald-400 mt-2 flex items-center gap-1">
              ↑ +12% par rapport à hier
            </p>
          </div>

          {/* Stat Card 2 */}
          <div className="glass-card p-6">
            <h3 className="text-slate-400 font-medium mb-2">Tickets Actifs</h3>
            <p className="text-4xl font-bold text-white">128</p>
            <p className="text-sm text-slate-500 mt-2">Connectés sur 3 routeurs</p>
          </div>

           {/* Stat Card 3 */}
           <div className="glass-card p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
            <h3 className="text-slate-400 font-medium mb-2">Paiements Mobile Money</h3>
            <p className="text-4xl font-bold text-white">99%</p>
            <p className="text-sm text-slate-500 mt-2">Taux de succès</p>
          </div>
        </motion.div>
        
      </main>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<DashboardLayout />} />
      </Routes>
    </Router>
  );
}

export default App;

import { Link, useLocation } from 'react-router-dom';
import { Wifi, BarChart3, Settings, ShieldCheck, Ticket, CreditCard, Package, Shield } from 'lucide-react';

export default function Sidebar() {
  const location = useLocation();

  const links = [
    { name: 'Tableau de bord', path: '/', icon: BarChart3 },
    { name: 'Routeurs', path: '/routers', icon: Settings },
    { name: 'Forfaits', path: '/packages', icon: Package },
    { name: 'Tickets', path: '/tickets', icon: Ticket },
    { name: 'Transactions', path: '/transactions', icon: CreditCard },
    { name: 'Journal Sécurité', path: '/security', icon: Shield },
  ];

  return (
    <aside className="w-full md:w-64 bg-dark-card border-r border-dark-border p-6 flex flex-col gap-6 shrink-0">
      <div className="flex items-center gap-3 text-brand-500 mb-4">
        <Wifi className="w-8 h-8" />
        <span className="text-xl font-bold text-white tracking-wide">WiFi Zone</span>
      </div>
      
      <nav className="flex flex-col gap-2">
        {links.map((link) => {
          const isActive = location.pathname === link.path;
          const Icon = link.icon;
          return (
            <Link 
              key={link.path} 
              to={link.path} 
              className={`flex items-center gap-3 p-3 rounded-lg font-medium transition-colors ${
                isActive 
                  ? 'bg-brand-600/10 text-brand-500' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <Icon className="w-5 h-5" />
              {link.name}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto p-4 bg-slate-900/50 rounded-xl border border-dark-border/50 flex items-center gap-3">
        <ShieldCheck className="text-brand-500 w-5 h-5" />
        <div className="text-xs">
          <p className="font-semibold text-slate-300">Sécurité Active</p>
          <p className="text-slate-500">Connexion chiffrée</p>
        </div>
      </div>
    </aside>
  );
}

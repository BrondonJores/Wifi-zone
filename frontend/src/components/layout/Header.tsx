import { Bell, Search, User } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

export default function Header() {
  const { user } = useAppStore();

  return (
    <header className="h-20 px-8 flex items-center justify-between border-b border-dark-border bg-dark-bg/50 backdrop-blur-sm sticky top-0 z-10">
      <div className="flex items-center gap-4 flex-1">
        <div className="relative w-full max-w-md hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Rechercher un ticket, un numéro..." 
            className="w-full bg-dark-card border border-dark-border rounded-lg pl-10 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-colors"
          />
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <button className="relative p-2 text-slate-400 hover:text-white transition-colors">
          <Bell className="w-6 h-6" />
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-brand-500 rounded-full border-2 border-dark-bg"></span>
        </button>
        <div className="h-8 w-px bg-dark-border mx-2"></div>
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-slate-200">{user?.name || 'Administrateur'}</p>
            <p className="text-xs text-slate-500">Super Admin</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-brand-600/20 flex items-center justify-center border border-brand-500/30">
            <User className="w-5 h-5 text-brand-500" />
          </div>
        </div>
      </div>
    </header>
  );
}

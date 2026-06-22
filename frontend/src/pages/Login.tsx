import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Wifi, Lock, Mail, Loader2 } from 'lucide-react';
import apiClient from '../api/client';
import { useAppStore } from '../store/useAppStore';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setUser } = useAppStore();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Appel à l'API Backend (SOLID & Sécurisée)
      const res = await apiClient.post('/auth/login', { email, password });
      
      if (res.data.success) {
        // Stocker l'utilisateur dans Zustand (persiste dans localStorage)
        setUser(res.data.admin);
        // Le JWT est automatiquement stocké dans le cookie HttpOnly par le backend
        navigate('/');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erreur de connexion. Vérifiez vos identifiants.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4">
      {/* Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-brand-500/10 rounded-full blur-[120px]"></div>
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-blue-500/10 rounded-full blur-[120px]"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="glass-card w-full max-w-md p-8 relative z-10"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-brand-600/20 rounded-full flex items-center justify-center mb-4">
            <Wifi className="w-8 h-8 text-brand-500" />
          </div>
          <h2 className="text-2xl font-bold text-white text-center">Connexion SaaS</h2>
          <p className="text-slate-400 text-sm mt-1">Espace sécurisé pour les gérants de hotspots</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-300 ml-1">Adresse Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input 
                type="email" 
                required
                className="input-field pl-10" 
                placeholder="admin@hotspot.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-300 ml-1">Mot de passe</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input 
                type="password" 
                required
                className="input-field pl-10" 
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="btn-primary w-full flex justify-center py-3 mt-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Se connecter'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAppStore } from './store/useAppStore';
import Login from './pages/Login';
import DashboardLayout from './components/layout/DashboardLayout';
import Dashboard from './pages/Dashboard';
import Routers from './pages/Routers';
import Packages from './pages/Packages';
import Tickets from './pages/Tickets';
import Transactions from './pages/Transactions';
import Security from './pages/Security';

// Composant pour protéger les routes
const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  // Vérification du token JWT dans le cookie HttpOnly via l'état Zustand
  // L'état est initialisé depuis le cookie au démarrage de l'app
  const { isAuthenticated } = useAppStore();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

function App() {
  return (
    <Router>
      <Toaster position="top-right" toastOptions={{ className: 'bg-slate-800 text-white border border-slate-700' }} />
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/" element={<PrivateRoute><DashboardLayout /></PrivateRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="routers" element={<Routers />} />
          <Route path="packages" element={<Packages />} />
          <Route path="tickets" element={<Tickets />} />
          <Route path="transactions" element={<Transactions />} />
          <Route path="security" element={<Security />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;

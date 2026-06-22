import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api', // En production, Nginx redirige automatiquement /api vers le backend
  withCredentials: true, // IMPORTANT: Permet d'envoyer et recevoir les cookies HttpOnly (JWT)
  headers: {
    'Content-Type': 'application/json'
  }
});

// Intercepteur pour gérer automatiquement les erreurs d'authentification globale (ex: Token expiré)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Redirection automatique vers le login si la session a expiré
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;

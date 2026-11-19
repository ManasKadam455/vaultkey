// api/axios.js
// Pre-configured Axios instance used throughout the app.
// Two interceptors keep all auth logic in one place.

import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  withCredentials: true,
});

// --- Request interceptor ---
// Attach the JWT from localStorage to every outgoing request.
// WHY here and not in each component?
//   Single point of change — if the header format changes, we only update here.
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// --- Response interceptor ---
// If the server returns 401 (token expired or invalid), log the user out
// and send them to the login page automatically.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      // Only redirect if we're not already on an auth page to avoid loops
      if (!window.location.pathname.startsWith('/login') &&
          !window.location.pathname.startsWith('/register')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

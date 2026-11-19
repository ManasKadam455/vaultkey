// context/AuthContext.jsx
// Global auth state: who is logged in, their token, and auth actions.
//
// WHY Context?
//   Many components (header, protected routes, API calls) need to know who is
//   logged in. Rather than prop-drilling, we share state via React Context.
//   Any component can call useAuth() and get the current user and actions.

import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Seed token from localStorage so a page refresh doesn't log the user out
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [user,  setUser]  = useState(null);

  // On mount (or whenever the token changes) decode the JWT payload to get
  // basic user info (id, name, email). We don't verify the signature here —
  // that happens on every request the server processes.
  useEffect(() => {
    if (!token) { setUser(null); return; }
    try {
      // JWTs are three base64url-encoded parts separated by dots.
      // The middle part is the payload.
      const payload = JSON.parse(atob(token.split('.')[1]));
      setUser(payload);
    } catch {
      // Malformed token — treat as logged out
      clearAuth();
    }
  }, [token]);

  const saveToken = (newToken, newUser) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(newUser);
  };

  const clearAuth = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  // --- Auth actions ---
  // These call the API and update local state on success.
  // Components catch errors themselves so they can display them.

  const register = async (name, email, password) => {
    const { data } = await api.post('/auth/register', { name, email, password });
    saveToken(data.token, data.user);
    return data;
  };

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    saveToken(data.token, data.user);
    return data;
  };

  const logout = () => clearAuth();

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook — components import this instead of AuthContext directly
export const useAuth = () => useContext(AuthContext);

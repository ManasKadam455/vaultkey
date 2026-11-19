// components/ProtectedRoute.jsx
// Wraps routes that require authentication.
// If there's no token in context, redirects to /login immediately.
// The 'replace' prop replaces history so the user can't back-button past login.

import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { token } = useAuth();
  return token ? children : <Navigate to="/login" replace />;
}

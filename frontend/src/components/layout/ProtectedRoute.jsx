import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

/**
 * Route guard component that checks for active session token.
 * Redirects unauthenticated visitors to /login.
 */
export default function ProtectedRoute({ children }) {
  const token = localStorage.getItem('clinora_token');
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

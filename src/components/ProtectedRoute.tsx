import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  /**
   * A single role string OR an array of allowed roles.
   * e.g. requiredRole="SELLER"  OR  requiredRole={["ADMIN","SUPER_ADMIN"]}
   */
  requiredRole?: string | string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div className="loading-container">Loading...</div>;
  }

  if (!isAuthenticated || !user) {
    // Dynamically redirect based on requiredRole or path
    let redirectPath = '/seller/login';

    if (requiredRole) {
      const allowed = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
      if (allowed.includes('ADMIN') || allowed.includes('SUPER_ADMIN')) {
        redirectPath = '/admin/login';
      } else if (allowed.includes('BUYER') && !allowed.includes('SELLER')) {
        redirectPath = '/login';
      } else if (allowed.includes('BUYER') && allowed.includes('SELLER')) {
        // Mixed role, check path
        if (location.pathname.startsWith('/buyer') || location.pathname === '/checkout' || location.pathname === '/profile' || location.pathname === '/orders' || location.pathname === '/wishlist') {
          redirectPath = '/login';
        }
      }
    } else {
      if (location.pathname.startsWith('/admin')) redirectPath = '/admin/login';
      else if (location.pathname.startsWith('/buyer') || location.pathname === '/checkout' || location.pathname === '/profile' || location.pathname === '/orders' || location.pathname === '/wishlist') redirectPath = '/login';
    }

    return <Navigate to={redirectPath} state={{ from: location }} replace />;
  }

  if (requiredRole) {
    const allowed = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    if (!allowed.includes(user.role)) {
      // Redirect to the page appropriate for their actual role
      if (user.role === 'SELLER') return <Navigate to="/seller/dashboard" replace />;
      if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN')
        return <Navigate to="/admin/sellers" replace />;
      if (user.role === 'BUYER') return <Navigate to="/products" replace />;
      return <Navigate to="/seller/login" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;

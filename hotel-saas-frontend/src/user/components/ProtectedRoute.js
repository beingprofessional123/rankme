import React, { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { PermissionContext } from '../UserPermission';

const isAuthenticated = () => {
  const token = localStorage.getItem('token');
  if (!token) return false;

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 > Date.now(); // Token not expired
  } catch (err) {
    return false;
  }
};

const alwaysAllowedModules = ['dashboard', 'settings'];

const ProtectedRoute = ({ children, module, requiredPermission = 'tab' }) => {
  const location = useLocation();
  const { permissions, role, isLoading } = useContext(PermissionContext);
  const rawUser = localStorage.getItem('user');
  const user = rawUser ? JSON.parse(rawUser) : null;

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3">Loading, please wait...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  if (role?.name === 'company_admin' || user?.role === 'company_admin') {
    return children; // Full access
  }

  if (alwaysAllowedModules.includes(module)) {
    return children;
  }

  const hasPermission = permissions?.[module]?.[requiredPermission] === true;

  if (!hasPermission) {
    return (
      <Navigate
        to="/access-denied?reason=denied"
        state={{ from: location.pathname }}
        replace
      />
    );
  }

  return children;
};

export default ProtectedRoute;

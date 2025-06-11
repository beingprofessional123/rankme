import React from 'react';
import { Navigate } from 'react-router-dom';

// Utility to check if token exists and is valid (you can enhance this later)
const isAuthenticated = () => {
  const token = localStorage.getItem('token');
  if (!token) return false;

  try {
    // Optional: Decode token and check expiration
    const payload = JSON.parse(atob(token.split('.')[1]));
    const isExpired = payload.exp * 1000 < Date.now();
    return !isExpired;
  } catch (err) {
    return false;
  }
};

const ProtectedRoute = ({ children }) => {
  return isAuthenticated() ? children : <Navigate to="/login" replace />;
};

export default ProtectedRoute;

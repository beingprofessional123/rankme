import React, { createContext, useEffect, useState } from 'react';

export const PermissionContext = createContext();

export const PermissionProvider = ({ children }) => {
  const [permissions, setPermissions] = useState({});
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);

  const fetchUserPermissions = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/user-permissions`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.status === 'success') {
        const { permissions = {}, user = null, role = null } = data.results;
        setPermissions(permissions);
        setUser(user);
        setRole(role);
        if (user && user.is_active === false) {
          localStorage.removeItem('user');
          localStorage.removeItem('token');
          window.location.href = '/inactive?status=true'; // Pass status=true in URL
        }
      }
    } catch (error) {
      console.error('Failed to fetch permissions:', error);
    }
  };

  useEffect(() => {
    fetchUserPermissions(); // Always fetch fresh permissions on load
  }, []);

  return (
    <PermissionContext.Provider value={{ permissions, user, role }}>
      {children}
    </PermissionContext.Provider>
  );
};

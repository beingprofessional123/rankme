import React from 'react';
import AppRoutes from './user/routes/AppRoutes';
import AdminAppRoutes from './admin/routes/AdminAppRoutes';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { PermissionProvider } from './user/UserPermission';

const App = () => {

  const isAdmin = window.location.pathname.startsWith('/admin');

  return isAdmin ? (
    <>
      <AdminAppRoutes />
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </>
  ) : (
    <>
      <PermissionProvider>
        <AppRoutes />
      </PermissionProvider>
    </>
  );
};

export default App;

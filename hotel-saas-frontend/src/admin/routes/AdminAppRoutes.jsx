import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from '../pages/auth/Login';
import Head from '../layouts/Head';
import AdminLayout from '../layouts/AdminLayout';
import Dashboard from '../pages/Dashboard';
import UserManagementIndex from '../pages/UserManagement/Index';
import UserManagementCreate from '../pages/UserManagement/create';
import UserManagementEdit from '../pages/UserManagement/edit';
import UserManagementView from '../pages/UserManagement/view';
import Script from '../layouts/Script';


// Route guards
import ProtectedRoute from './ProtectedRoute';
import GuestRoute from './GuestRoute';

const AdminAppRoutes = () => {
  return (
    <Router>
      <Head />
      <Script />
      <Routes>
        {/* Login page: only accessible if NOT logged in */}
        <Route path="/admin/login" element={<GuestRoute> <Login /> </GuestRoute>}/>
        <Route path="/admin" element={<GuestRoute> <Login /> </GuestRoute> }/>

        {/* Protected Admin Routes */}
        <Route path="/admin/dashboard" element={<ProtectedRoute><AdminLayout><Dashboard /></AdminLayout></ProtectedRoute> }/>
        <Route path="/admin/user-management" element={<ProtectedRoute><AdminLayout><UserManagementIndex /></AdminLayout></ProtectedRoute> }/>
        <Route path="/admin/user-management/create" element={<ProtectedRoute><AdminLayout><UserManagementCreate /></AdminLayout></ProtectedRoute> }/>
        <Route path="/admin/user-management/:id/edit" element={<ProtectedRoute><AdminLayout><UserManagementEdit /></AdminLayout></ProtectedRoute> }/>
        <Route path="/admin/user-management/:id" element={<ProtectedRoute><AdminLayout><UserManagementView /></AdminLayout></ProtectedRoute> }/>
      </Routes>
    </Router>
  );
};

export default AdminAppRoutes;

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from '../pages/auth/Login';
import AdminLayout from '../layouts/AdminLayout';
import Dashboard from '../pages/Dashboard';
import UserManagementIndex from '../pages/UserManagement/Index';
import UserManagementCreate from '../pages/UserManagement/create';
import UserManagementEdit from '../pages/UserManagement/edit';
import UserManagementView from '../pages/UserManagement/view';
import PlanManagementIndex from '../pages/PlanManagement/Index';
import PlanManagementCreate from '../pages/PlanManagement/create';
import PlanManagementEdit from '../pages/PlanManagement/edit';
import PlanManagementView from '../pages/PlanManagement/view';
import TransactionManagementIndex from '../pages/Transaction/Index';
import SupportTicketManagementIndex from '../pages/SupportTicketManagement/Index';
import SupportTicketManagementEdit from '../pages/SupportTicketManagement/edit';
import Script from '../layouts/Script';
  

// Route guards
import ProtectedRoute from './ProtectedRoute';
import GuestRoute from './GuestRoute';

const AdminAppRoutes = () => {
  return (
    <Router>
      <Script />
      <Routes>
        {/* Login page: only accessible if NOT logged in */}
        <Route path="/admin/login" element={<GuestRoute> <Login /> </GuestRoute>}/>
        <Route path="/admin" element={<GuestRoute> <Login /> </GuestRoute> }/>

        {/* Protected Admin Routes Dashborad */}
        <Route path="/admin/dashboard" element={<ProtectedRoute><AdminLayout><Dashboard /></AdminLayout></ProtectedRoute> }/>
        {/* User Management */}
        <Route path="/admin/user-management" element={<ProtectedRoute><AdminLayout><UserManagementIndex /></AdminLayout></ProtectedRoute> }/>
        <Route path="/admin/user-management/create" element={<ProtectedRoute><AdminLayout><UserManagementCreate /></AdminLayout></ProtectedRoute> }/>
        <Route path="/admin/user-management/:id/edit" element={<ProtectedRoute><AdminLayout><UserManagementEdit /></AdminLayout></ProtectedRoute> }/>
        <Route path="/admin/user-management/:id" element={<ProtectedRoute><AdminLayout><UserManagementView /></AdminLayout></ProtectedRoute> }/>
        {/* Plan Management */}
        <Route path="/admin/plan-management" element={<ProtectedRoute><AdminLayout><PlanManagementIndex /></AdminLayout></ProtectedRoute> }/>
        <Route path="/admin/plan-management/create" element={<ProtectedRoute><AdminLayout><PlanManagementCreate /></AdminLayout></ProtectedRoute> }/>
        <Route path="/admin/plan-management/:id/edit" element={<ProtectedRoute><AdminLayout><PlanManagementEdit /></AdminLayout></ProtectedRoute> }/>
        <Route path="/admin/plan-management/:id" element={<ProtectedRoute><AdminLayout><PlanManagementView /></AdminLayout></ProtectedRoute> }/>
        
        <Route path="/admin/transaction-management" element={<ProtectedRoute><AdminLayout><TransactionManagementIndex /></AdminLayout></ProtectedRoute> }/>

        {/* Plan Management */}
        <Route path="/admin/support-ticket-management" element={<ProtectedRoute><AdminLayout><SupportTicketManagementIndex /></AdminLayout></ProtectedRoute> }/>
        <Route path="/admin/support-ticket-management/:id/edit" element={<ProtectedRoute><AdminLayout><SupportTicketManagementEdit /></AdminLayout></ProtectedRoute> }/>

     
      </Routes>
    </Router>
  );
};

export default AdminAppRoutes;

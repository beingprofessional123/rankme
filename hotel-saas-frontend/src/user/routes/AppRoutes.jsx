import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from '../pages/auth/Login';
import ForgotPassword from '../pages/auth/ForgotPassword/ForgotPassword';
import ResetPassword from '../pages/auth/ForgotPassword/ResetPassword';
import ChangePassword from '../pages/auth/ChangePassword';
import PasswordResetSuccess from '../pages/auth/ForgotPassword/PasswordResetSuccess';
import SubscriptionPlan from '../pages/auth/Signup/SubscriptionPlan';
import PaymentSuccess from '../pages/auth/Signup/PaymentSuccess';
import CompanySignup from '../pages/auth/Signup/CompanySignup';
import SetupWizard from '../pages/SetupWizard/SetupWizard';
import Dashboard from '../pages/Dashboard';
import PricingCalendar from '../pages/PricingCalendar/pricing-calendar';
// import RoomTypes from '../pages/SetupWizard/RoomTypes';
// import RateCategories from '../pages/SetupWizard/RateCategories';
import ProtectedRoute from '../components/ProtectedRoute';
import Billing from '../pages/Billing/Billing';
import UploadData from '../pages/UploadData/UploadData';
import HotelsAndRoomsList from '../pages/HotelAndRooms/List';
import HotelAndRoomDetails from '../pages/HotelAndRooms/Details';
import HotelAndRoomCreate from '../pages/HotelAndRooms/Create';
import HotelAndRoomEdit from '../pages/HotelAndRooms/Edit';
import ForecastPage from '../pages/Forecast/ForecastPage';
import ReportPage from '../pages/Reports/ReportPage';
import CompetitorRatesPage from '../pages/CompetitorRates/CompetitorRatesPage';
import UserRoleManagementPage from '../pages/UserRoleManagement/UserRoleManagementPage';
import UserRoleManagementAddPage from '../pages/UserRoleManagement/UserRoleManagementAddPage';
import UserRoleManagementEditPage from '../pages/UserRoleManagement/UserRoleManagementEditPage';
import SupportTicketPage from '../pages/SupportTicket/SupportTicketPage';
import SupportTicketAddPage from '../pages/SupportTicket/SupportTicketAddPage';
import SupportTicketEditPage from '../pages/SupportTicket/SupportTicketEditPage';
import SupportTicketViewPage from '../pages/SupportTicket/SupportTicketViewPage';
import SettingsPage from '../pages/Settings/SettingsPage';
import InactivePage from '.././error/InactivePage';




const AppRoutes = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/inactive" element={<InactivePage />} />
        <Route path="/change-password" element={<ChangePassword />} />
        <Route path="/signup" element={<CompanySignup />} />

        {/* ForgotPassword */}
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/password-reset-success" element={<PasswordResetSuccess />} />

        {/* Protected Routes */}
        <Route path="/subscription" element={<ProtectedRoute><SubscriptionPlan /></ProtectedRoute>} />
        <Route path="/payment-success" element={<ProtectedRoute><PaymentSuccess /></ProtectedRoute>} />
        <Route path="/setup/setup-wizard" element={<ProtectedRoute><SetupWizard /></ProtectedRoute>} />
        {/* <Route path="/setup/room-types" element={<ProtectedRoute><RoomTypes /></ProtectedRoute>} />
        <Route path="/setup/rate-categories" element={<ProtectedRoute><RateCategories /></ProtectedRoute>} /> */}
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/pricing-calendar" element={<ProtectedRoute><PricingCalendar /></ProtectedRoute>} />
        <Route path="/billing" element={<ProtectedRoute><Billing /></ProtectedRoute>} />
        <Route path="/upload-data" element={<ProtectedRoute><UploadData  /></ProtectedRoute>} />
        <Route path="/hotels-and-rooms" element={<ProtectedRoute><HotelsAndRoomsList /></ProtectedRoute>} /> 
        <Route path="/hotels-and-rooms/add" element={<ProtectedRoute><HotelAndRoomCreate /></ProtectedRoute>} /> 
        <Route path="/hotels-and-rooms/:id" element={<ProtectedRoute><HotelAndRoomDetails /></ProtectedRoute>} /> 
        <Route path="/hotels-and-rooms/edit/:id" element={<ProtectedRoute><HotelAndRoomEdit /></ProtectedRoute>} /> 
        <Route path="/forecast" element={<ProtectedRoute><ForecastPage /></ProtectedRoute>} /> 
        <Route path="/reports" element={<ProtectedRoute><ReportPage /></ProtectedRoute>} /> 
        <Route path="/competitor-rate" element={<ProtectedRoute><CompetitorRatesPage /></ProtectedRoute>} /> 
        <Route path="/user-role-management" element={<ProtectedRoute><UserRoleManagementPage /></ProtectedRoute>} /> 
        <Route path="/user-role-management-add" element={<ProtectedRoute><UserRoleManagementAddPage /></ProtectedRoute>} /> 
        <Route path="/user-role-management-edit/:id" element={<ProtectedRoute><UserRoleManagementEditPage /></ProtectedRoute>} /> 
        <Route path="/support-tickets" element={<ProtectedRoute><SupportTicketPage /></ProtectedRoute>} /> 
        <Route path="/support-tickets-add" element={<ProtectedRoute><SupportTicketAddPage /></ProtectedRoute>} /> 
        <Route path="/support-tickets-edit/:id" element={<ProtectedRoute><SupportTicketEditPage /></ProtectedRoute>} /> 
        <Route path="/support-tickets-view/:id" element={<ProtectedRoute><SupportTicketViewPage /></ProtectedRoute>} /> 
        <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} /> 

        {/* Add more routes later */}
      </Routes>
    </Router>
  );
};

export default AppRoutes;

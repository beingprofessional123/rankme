// src/components/Sidebar.jsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom'; // Import useLocation for active link styling


const Sidebar = () => {
  const location = useLocation(); // Hook to get current path

  // Helper function to check if a link is active
  const isActive = (segment) => location.pathname.includes(segment);

  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <Link to="/dashboard"><img src={`/user/images/logo-w.png`} className="img-fluid" alt="RankMeOne Logo" /></Link>
      </div>
      <ul>
        <li className={isActive('/dashboard') ? 'active' : ''}>
          <Link to="/dashboard">
            <span><img src={`/user/images/dashboard.svg`} className="img-fluid" alt="Dashboard" /></span>Dashboard
          </Link>
        </li>
        <li className={isActive('/pricing-calendar') ? 'active' : ''}>
          <Link to="/pricing-calendar">
            <span><img src={`/user/images/calendar.svg`} className="img-fluid" alt="Pricing Calendar" /></span>Pricing Calendar
          </Link>
        </li>
        <li className={isActive('/forecast') ? 'active' : ''}>
          <Link to="/forecast">
            <span><img src={`/user/images/forecast.svg`} className="img-fluid" alt="Forecast" /></span>Forecast
          </Link>
        </li>
        <li className={isActive('/reports') ? 'active' : ''}>
          <Link to="/reports">
            <span><img src={`/user/images/reports.svg`} className="img-fluid" alt="Reports" /></span>Reports
          </Link>
        </li>
        <li className={isActive('/hotels-and-rooms') ? 'active' : ''}>
          <Link to="/hotels-and-rooms">
            <span><img src={`/user/images/hotels.svg`} className="img-fluid" alt="Hotels & Rooms" /></span>Hotels & Rooms
          </Link>
        </li>
        <li className={isActive('/upload-data') ? 'active' : ''}>
          <Link to="/upload-data">
            <span><img src={`/user/images/upload.svg`} className="img-fluid" alt="Upload Data" /></span>Upload Data
          </Link>
        </li>
        <li className={isActive('/competitor-rate') ? 'active' : ''}>
          <Link to="/competitor-rate">
            <span><img src={`/user/images/competitor.svg`} className="img-fluid" alt="Competitor Rates" /></span>Competitor Rates
          </Link>
        </li>
        <li className={isActive('/user-role-management') ? 'active' : ''}>
          <Link to="/user-role-management">
            <span><img src={`/user/images/role.svg`} className="img-fluid" alt="User Role Management" /></span>User Role Management
          </Link>
        </li>
        <li className={isActive('/billing') ? 'active' : ''}>
          <Link to="/billing">
            <span><img src={`/user/images/billing.svg`} className="img-fluid" alt="Billing" /></span>Billing
          </Link>
        </li>
        <li className={isActive('/support-tickets') ? 'active' : ''}>
          <Link to="/support-tickets">
            <span><img src={`/user/images/support.svg`} className="img-fluid" alt="Support" /></span>
            Support
          </Link>
        </li>
        <li className={isActive('/settings') ? 'active' : ''}>
          <Link to="/settings">
            <span><img src={`/user/images/settings.svg`} className="img-fluid" alt="Settings" /></span>Settings
          </Link>
        </li>
      </ul>
    </div>
  );
};

export default Sidebar;
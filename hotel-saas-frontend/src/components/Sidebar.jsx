// src/components/Sidebar.jsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom'; // Import useLocation for active link styling

// Import your image assets for sidebar icons
import logoWhite from '../assets/images/logo-w.png'; // White logo for sidebar
import dashboardIcon from '../assets/images/dashboard.svg';
import calendarIcon from '../assets/images/calendar.svg';
import forecastIcon from '../assets/images/forecast.svg';
import reportsIcon from '../assets/images/reports.svg';
import hotelsIcon from '../assets/images/hotels.svg';
import uploadIcon from '../assets/images/upload.svg';
import competitorIcon from '../assets/images/competitor.svg';
import roleIcon from '../assets/images/role.svg'; // Assuming you have a specific icon for User Role Management
import billingIcon from '../assets/images/billing.svg';
import supportIcon from '../assets/images/support.svg';
import settingsIcon from '../assets/images/settings.svg';


const Sidebar = () => {
  const location = useLocation(); // Hook to get current path

  // Helper function to check if a link is active
  const isActive = (segment) => location.pathname.includes(segment);

  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <Link to="/dashboard"><img src={logoWhite} className="img-fluid" alt="RankMeOne Logo" /></Link>
      </div>
      <ul>
        <li className={isActive('/dashboard') ? 'active' : ''}>
          <Link to="/dashboard">
            <span><img src={dashboardIcon} className="img-fluid" alt="Dashboard" /></span>Dashboard
          </Link>
        </li>
        <li className={isActive('/pricing-calendar') ? 'active' : ''}>
          <Link to="/pricing-calendar">
            <span><img src={calendarIcon} className="img-fluid" alt="Pricing Calendar" /></span>Pricing Calendar
          </Link>
        </li>
        <li className={isActive('/forecast') ? 'active' : ''}>
          <Link to="/forecast">
            <span><img src={forecastIcon} className="img-fluid" alt="Forecast" /></span>Forecast
          </Link>
        </li>
        <li className={isActive('/reports') ? 'active' : ''}>
          <Link to="/reports">
            <span><img src={reportsIcon} className="img-fluid" alt="Reports" /></span>Reports
          </Link>
        </li>
        <li className={isActive('/hotels-and-rooms') ? 'active' : ''}>
          <Link to="/hotels-and-rooms">
            <span><img src={hotelsIcon} className="img-fluid" alt="Hotels & Rooms" /></span>Hotels & Rooms
          </Link>
        </li>
        <li className={isActive('/upload-data') ? 'active' : ''}>
          <Link to="/upload-data">
            <span><img src={uploadIcon} className="img-fluid" alt="Upload Data" /></span>Upload Data
          </Link>
        </li>
        <li className={isActive('/competitor-rate') ? 'active' : ''}>
          <Link to="/competitor-rate">
            <span><img src={competitorIcon} className="img-fluid" alt="Competitor Rates" /></span>Competitor Rates
          </Link>
        </li>
        <li className={isActive('/user-role-management') ? 'active' : ''}>
          <Link to="/user-role-management">
            <span><img src={roleIcon} className="img-fluid" alt="User Role Management" /></span>User Role Management
          </Link>
        </li>
        <li className={isActive('/billing') ? 'active' : ''}>
          <Link to="/billing">
            <span><img src={billingIcon} className="img-fluid" alt="Billing" /></span>Billing
          </Link>
        </li>
        <li className={isActive('/support-tickets') ? 'active' : ''}>
          <Link to="/support-tickets">
            <span><img src={supportIcon} className="img-fluid" alt="Support" /></span>
            Support
          </Link>
        </li>
        <li className={isActive('/settings') ? 'active' : ''}>
          <Link to="/settings">
            <span><img src={settingsIcon} className="img-fluid" alt="Settings" /></span>Settings
          </Link>
        </li>
      </ul>
    </div>
  );
};

export default Sidebar;
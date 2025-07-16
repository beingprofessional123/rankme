import React, { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { PermissionContext } from '../UserPermission';

const Sidebar = () => {
  const location = useLocation();
  const { permissions, role } = useContext(PermissionContext);

  const isCompanyAdmin = role?.name === 'company_admin';

  // ✅ Updated isActive logic
  const isActive = (path, key) => {
    if (key === 'billing') {
      return (
        location.pathname.startsWith('/billing') ||
        location.pathname.startsWith('/invoice-history') ||
        location.pathname.startsWith('/upgrade-plan')
      );
    }
    return location.pathname.startsWith(path);
  };

  const canAccess = (key) => {
    if (key === 'settings') return true;
    return isCompanyAdmin || permissions?.[key]?.tab;
  };

  const sidebarItems = [
    { path: '/dashboard', label: 'Dashboard', icon: 'dashboard.svg', key: 'dashboard' },
    { path: '/pricing-calendar', label: 'Pricing Calendar', icon: 'calendar.svg', key: 'pricing_calendar' },
    { path: '/forecast', label: 'Forecast', icon: 'forecast.svg', key: 'forecasts' },
    { path: '/reports', label: 'Reports', icon: 'reports.svg', key: 'reports' },
    { path: '/hotels-and-rooms', label: 'Hotels & Rooms', icon: 'hotels.svg', key: 'hotels_rooms' },
    { path: '/upload-data', label: 'Upload Data', icon: 'upload.svg', key: 'upload_data' },
    { path: '/competitor-rate', label: 'Competitor Rates', icon: 'competitor.svg', key: 'competitor_rates' },
    { path: '/user-role-management', label: 'User Role Management', icon: 'role.svg', key: 'user_role_management' },
    { path: '/billing', label: 'Billing', icon: 'billing.svg', key: 'billing' },
    { path: '/support-tickets', label: 'Support', icon: 'support.svg', key: 'support_ticket' },
    { path: '/settings', label: 'Settings', icon: 'settings.svg', key: 'settings' },
    // { path: '/bookings', label: 'Bookings', icon: 'bookings.svg', key: 'bookings' },
    // { path: '/competitor-data', label: 'Competitor Data', icon: 'competitor-data.svg', key: 'competitordata' },
    // { path: '/str-ocr-reports', label: 'STR/OCR Reports', icon: 'str-ocr-reports.svg', key: 'str-ocr-reports' },
  ];

  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <Link to="/dashboard">
          <img src="/user/images/logo-w.png" className="img-fluid" alt="RankMeOne Logo" />
        </Link>
      </div>
      <ul>
        {sidebarItems.map(({ path, label, icon, key }) => (
          canAccess(key) && (
            <li key={key} className={isActive(path, key) ? 'active' : ''}>
              <Link to={path}>
                <span>
                  <img src={`/user/images/${icon}`} className="img-fluid" alt={label} />
                </span>
                {label}
              </Link>
            </li>
          )
        ))}
      </ul>
    </div>
  );
};

export default Sidebar;

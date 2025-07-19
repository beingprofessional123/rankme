import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

const Sidebar = () => {
  const location = useLocation();
  const isActive = (path) => location.pathname.startsWith(path);

  useEffect(() => {
    const handleClick = (e) => {
      if (e.target.closest('.sidebar_collapse_btn')) {
        const btn = e.target.closest('.sidebar_collapse_btn');
        const click = btn.getAttribute('data-click') === '1';
        const sidebar = document.getElementById('compact_submenuSidebar');
        if (click) {
          sidebar.style.display = 'none';
          btn.setAttribute('data-click', '0');
        } else {
          sidebar.style.display = 'block';
          btn.setAttribute('data-click', '1');
        }
      }
    };
    document.body.addEventListener('click', handleClick);
    return () => document.body.removeEventListener('click', handleClick);
  }, []);

  return (
    <>
      <style>
        {`
          #compactSidebar {
            display: none;
          }

          .sidebar-wrapper #compact_submenuSidebar.show {
            left: 0px;
          }

          .sidebar-wrapper #compact_submenuSidebar {
            position: sticky;
          }

          #content {
            margin-left: 0px;
          }

          @media screen and (min-width: 1000px) {
            .account-settings-footer {
              width: calc(100% - 265px);
            }
          }
        `}
      </style>

      <div className="sidebar-wrapper sidebar-theme">
        <nav id="compactSidebar" />

        <div id="compact_submenuSidebar" className="submenu-sidebar submenu-sidebar ps show">
          <div className="submenu show" id="dashboard">
            <ul className="submenu-list" data-parent-element="#dashboard">
              {/* Dashboard Link */}
              <li className={isActive('/admin/dashboard') ? 'active' : ''}>
                <Link to="/admin/dashboard" className="text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-home"><path d="M3 9l9-7 9 7" /><path d="M9 22V12h6v10" /></svg>
                  Dashboard
                </Link>
              </li>
              {/* User Management Link */}
              <li className={isActive('/admin/user-management') ? 'active' : ''}>
                <Link to="/admin/user-management" className="text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-users"><path d="M17 21v-2a4 4 0 0 0-3-3.87" /><path d="M7 21v-2a4 4 0 0 1 3-3.87" /><path d="M12 7a4 4 0 1 0 0 8" /><path d="M5.5 8.5a4 4 0 1 0 5.5 5.5" /><path d="M18.5 8.5a4 4 0 1 1-5.5 5.5" /></svg>
                  User Management
                </Link>
              </li>
               {/* Plan Management Link */}
              <li className={isActive('/admin/plan-management') ? 'active' : ''}>
                <Link to="/admin/plan-management" className="text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                    className="feather feather-briefcase">
                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                    <path d="M16 3h-4a2 2 0 0 0-2 2v2h8V5a2 2 0 0 0-2-2z" />
                  </svg>
                  Plan Management
                </Link>
              </li>


            </ul>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;

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
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" class="feather feather-pie-chart"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path><path d="M22 12A10 10 0 0 0 12 2v10z"></path></svg>
                  Dashboard
                </Link>
              </li>
              {/* User Management Link */}
              <li className={isActive('/admin/user-management') ? 'active' : ''}>
                <Link to="/admin/user-management" className="text-white">
                  <svg
                    xmlns="http://www.w3.org/2000/svg" strokeWidth="0.8" strokeLinecap="round"
                    strokeLinejoin="round" class="feather feather-pie-chart" width="24" height="24"
                    viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path fill="none"
                      d="M14.023,12.154c1.514-1.192,2.488-3.038,2.488-5.114c0-3.597-2.914-6.512-6.512-6.512c-3.597,0-6.512,2.916-6.512,6.512c0,2.076,0.975,3.922,2.489,5.114c-2.714,1.385-4.625,4.117-4.836,7.318h1.186c0.229-2.998,2.177-5.512,4.86-6.566c0.853,0.41,1.804,0.646,2.813,0.646c1.01,0,1.961-0.236,2.812-0.646c2.684,1.055,4.633,3.568,4.859,6.566h1.188C18.648,16.271,16.736,13.539,14.023,12.154z M10,12.367c-2.943,0-5.328-2.385-5.328-5.327c0-2.943,2.385-5.328,5.328-5.328c2.943,0,5.328,2.385,5.328,5.328C15.328,9.982,12.943,12.367,10,12.367z">
                    </path>
                  </svg>
                  User Management
                </Link>
              </li>
              {/* Plan Management Link */}
              <li className={isActive('/admin/plan-management') ? 'active' : ''}>
                <Link to="/admin/plan-management" className="text-white">
                  <svg
                    xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
                    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                    strokeLinejoin="round" class="feather feather-send">
                    <line x1="22" y1="2" x2="11" y2="13"></line>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                  </svg>
                  Plan Management
                </Link>
              </li>
              {/* Transaction Management Link */}
              <li className={isActive('/admin/transaction-management') ? 'active' : ''}>
                <Link to="/admin/transaction-management" className="text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" class="feather feather-dollar-sign"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                  Transaction
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

// src/components/DashboardHeader.jsx
import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';

// import { FaBell, FaUserCircle } from 'react-icons/fa'; // No longer needed for this design

// Import your image assets
import notificationsIcon from '../assets/images/notifications.svg';
import userIcon from '../assets/images/user.png'; // Assuming this is for the user profile image
import profileIcon from '../assets/images/profile.svg';
import settingsIcon from '../assets/images/setting.svg';
import logoutIcon from '../assets/images/logout.svg';
import menuIcon from '../assets/images/Menu.svg'; // If you plan to implement a mobile menu toggle here
import logoMobile from '../assets/images/logo.png'; // Assuming this is for the mobile logo

const DashboardHeader = ({ username }) => {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const notificationsRef = useRef();
  const profileRef = useRef();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login'; // Redirect to login page
  };

  // Close menus when clicked outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setIsNotificationsOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

  return (
    <div className="topbar">
      <div className="container-fluid">
        <div className="row">
          <div className="col-md-5">
            <div className="welcomeuser">
              Welcome, <strong>{username}</strong>
            </div>
          </div>
          <div className="col-md-7">
            <div className="topbar-right">
              <div className="header-right navbar">
                {/* Mobile Logo - Only shown when the screen is small */}
                <div className="mobile-logo">
                  <Link to="/dashboard"><img src={logoMobile} className="img-fluid" alt="RankMeOne Logo" /></Link>
                </div>
                <ul className="navbar-nav ms-auto">
                  {/* Notifications Dropdown */}
                  <li className="nav-item dropdown notifications" ref={notificationsRef}>
                    <Link
                      className="nav-link dropdown-toggle"
                      to=''
                      role="button"
                      onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                      aria-expanded={isNotificationsOpen}
                    >
                      <img src={notificationsIcon} className="img-fluid" alt="Notifications" />
                    </Link>
                    {isNotificationsOpen && (
                      <ul className="dropdown-menu show"> {/* 'show' class from Bootstrap to make it visible */}
                        <li><Link className="dropdown-item" to=''>Lorem ipsum...<span>12min</span></Link></li>
                        <li><Link className="dropdown-item" to=''>Lorem ipsum...<span>12min</span></Link></li>
                        <li><Link className="dropdown-item" to=''>Lorem ipsum...<span>12min</span></Link></li>
                      </ul>
                    )}
                  </li>
                  {/* Profile Dropdown */}
                  <li className="nav-item dropdown profiledrop" ref={profileRef}>
                    <Link
                      className="nav-link dropdown-toggle"
                      to=''
                      role="button"
                      onClick={() => setIsProfileOpen(!isProfileOpen)}
                      aria-expanded={isProfileOpen}
                    >
                      <img src={userIcon} className="img-fluid" alt="User Profile" />
                    </Link>
                    {isProfileOpen && (
                      <ul className="dropdown-menu show"> {/* 'show' class from Bootstrap */}
                        <li>
                          <Link className="dropdown-item" to=''>
                            <img src={profileIcon} className="img-fluid" alt="Profile" />Profile
                          </Link>
                        </li>
                        <li>
                          <Link className="dropdown-item" to='/settings'>
                            <img src={settingsIcon} className="img-fluid" alt="Settings" />Settings
                          </Link>
                        </li>
                        <li>
                          <Link className="dropdown-item" to='' onClick={handleLogout}>
                            <img src={logoutIcon} className="img-fluid" alt="Logout" />Logout
                          </Link>
                        </li>
                      </ul>
                    )}
                  </li>
                  {/* Mobile Menu Icon (if implementing a toggle) */}
                  <li className="menuicon" id="menuicon">
                    <button>
                      <img src={menuIcon} className="img-fluid" alt="Menu" />
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHeader;
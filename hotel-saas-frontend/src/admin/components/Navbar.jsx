import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

const Navbar = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('admin_user') || '{}');
  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    navigate('/admin/login', { state: { message: 'Logged out successfully.' } });
  };

  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const notificationsRef = useRef();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    const token = localStorage.getItem('admin_token');
    if (!token) return;
    try {
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/admin/notifications`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      if (response.ok) {
        setNotifications(data.results);
      } else {
        console.error('Failed to fetch notifications:', data.message);
      }
    } catch (error) {
      console.error('Network error fetching notifications:', error);
    }
  };

  const markAsRead = async (id) => {
    const token = localStorage.getItem('admin_token');
    try {
      await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/admin/notifications/${id}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      setNotifications(prevNotifications =>
        prevNotifications.map(notif =>
          notif.id === id ? { ...notif, is_read: true } : notif
        )
      );
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  // ✅ NEW: Function to delete a notification
  const deleteNotification = async (id) => {
    const token = localStorage.getItem('admin_token');
    try {
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/admin/notifications/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        // Remove the notification from state without refetching
        setNotifications(prevNotifications =>
          prevNotifications.filter(notif => notif.id !== id)
        );
      } else {
        console.error('Failed to delete notification');
      }
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  // ✅ NEW: Function to mark all notifications as read
  const markAllAsRead = async () => {
    const token = localStorage.getItem('admin_token');
    try {
      await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/notifications/read-all`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      // Update the state to mark all notifications as read
      setNotifications(prevNotifications =>
        prevNotifications.map(notif => ({ ...notif, is_read: true }))
      );
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const unreadCount = notifications.filter(notif => !notif.is_read).length;


  return (
    <>
      <div className="header-container fixed-top">
        <header className="header navbar navbar-expand-sm">
          <ul className="navbar-item flex-row">
            <li className="nav-item theme-logo">
              <Link href="javascript:void(0);" onClick="window.location.reload();">
                <img src={`/user/images/logo.png`} className="navbar-logo" alt="logo-static" />
              </Link>
            </li>
          </ul>

          <Link href="javascript:void(0);" data-click="1" className="sidebarCollapse sidebar_collapse_btn" id="navbtn" data-placement="bottom"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-list"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3" y2="6"></line><line x1="3" y1="12" x2="3" y2="12"></line><line x1="3" y1="18" x2="3" y2="18"></line></svg></Link>

          <ul className="navbar-item flex-row search-ul">
            <li className="nav-item dropdown notifications" ref={notificationsRef}>
              <Link
                className="nav-link dropdown-toggle"
                to=''
                role="button"
                onClick={() => {
                  setIsNotificationsOpen(!isNotificationsOpen);
                  if (!isNotificationsOpen) {
                    fetchNotifications();
                  }
                }}
                aria-expanded={isNotificationsOpen}
              >
                <img src={`/user/images/notifications.svg`} className="img-fluid" alt="Notifications" />
                {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
              </Link>
              {isNotificationsOpen && (
                <ul className="dropdown-menu show notification-list">
                  {/* ✅ NEW: Read all button */}
                  <li className="read-all-btn-wrapper">
                    <button onClick={markAllAsRead} className="btn btn-link w-100 text-end">
                      Mark all as read
                    </button>
                  </li>
                  {notifications.length > 0 ? (
                    notifications.map(notif => (
                      <li key={notif.id} className={`notification-item ${notif.is_read ? '' : 'unread'}`}>
                        <Link
                          className="dropdown-item d-flex justify-content-between align-items-start"
                          to={notif.link || ''}
                          onClick={(e) => {
                            // Do not prevent default if a link exists
                            if (!notif.link) {
                              e.preventDefault();
                            }
                            markAsRead(notif.id);
                          }}
                        >
                          <div>
                            <strong>{notif.title}</strong>
                            <p>{notif.message}</p>
                            <span>{formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}</span>
                          </div>
                          {/* ✅ NEW: Delete button */}
                          <button
                            onClick={(e) => {
                              e.preventDefault(); // Prevent navigating when deleting
                              e.stopPropagation(); // Stop click from bubbling to the parent Link
                              deleteNotification(notif.id);
                            }}
                            className="btn btn-sm btn-link delete-btn"
                            title="Delete Notification"
                          >
                            <img src={`/user/images/close-icon.svg`} alt="Delete" />
                          </button>
                        </Link>
                      </li>
                    ))
                  ) : (
                    <li className="no-notifications">
                      <span className="dropdown-item">No new notifications.</span>
                    </li>
                  )}
                </ul>
              )}
            </li>
          </ul>
          <ul className="navbar-item flex-row navbar-dropdown">


            <li className="nav-item dropdown user-profile-dropdown  order-lg-0 order-1">
              <Link href="javascript:void(0);" className="nav-link dropdown-toggle user" id="userProfileDropdown" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                <img src={`/admin/assets/img/90x90.jpg`} alt="admin-profile" className="img-fluid" />
              </Link>
              <div className="dropdown-menu position-absolute animated fadeInUp" aria-labelledby="userProfileDropdown">
                <div className="user-profile-section">
                  <div className="media mx-auto">
                    <img src={`/admin/assets/img/90x90.jpg`} className="img-fluid mr-2" alt="avatar" />
                    <div className="media-body">
                      <h5>{user.name || 'Admin'}</h5>
                      <p>{user.role || 'Admin'}</p>
                    </div>
                  </div>
                </div>
                <div className="dropdown-item">
                  <Link to=''>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-user"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg> <span>My Profile</span>
                  </Link>
                </div>
                <div className="dropdown-item">
                  <Link to=''>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"> <path d="M336 352c97.2 0 176-78.8 176-176S433.2 0 336 0S160 78.8 160 176c0 18.7 2.9 36.8 8.3 53.7L7 391c-4.5 4.5-7 10.6-7 17v80c0 13.3 10.7 24 24 24h80c13.3 0 24-10.7 24-24V448h40c13.3 0 24-10.7 24-24V384h40c6.4 0 12.5-2.5 17-7l33.3-33.3c16.9 5.4 35 8.3 53.7 8.3zM376 96a40 40 0 1 1 0 80 40 40 0 1 1 0-80z" /></svg>
                    <span>Change Password</span>
                  </Link>
                </div>
                <div className="dropdown-item">
                  <Link to="#" onClick={(e) => { e.preventDefault(); handleLogout(); }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-log-out"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg> <span>Log Out</span>
                  </Link>
                </div>
              </div>
            </li>
          </ul>
        </header>
      </div>
    </>
  );
};

export default Navbar;

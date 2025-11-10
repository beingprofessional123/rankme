import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';


const Navbar = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('admin_user') || '{}');
  const muteKey = 'NotificationSoundisMutedRankmeAdmin';

  const [isMuted, setIsMuted] = useState(() => {
    const stored = localStorage.getItem(muteKey);
    if (stored === null) {
      localStorage.setItem(muteKey, 'true'); // Default muted
      return true;
    }
    return stored === 'true';
  });

  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const notificationsRef = useRef();

  // ✅ Play notification sound if allowed
  const playNotificationSound = (notif) => {
    const currentUrl = window.location.href;
    if (isMuted) return; // 🔇 Don’t play if muted

    // 🎯 Extract ticket IDs
    const currentMatch = currentUrl.match(/\/admin\/support-ticket-management\/([^/]+)\/edit/);
    const currentTicketId = currentMatch ? currentMatch[1] : null;
    const notifMatch = notif?.link?.match(/\/admin\/support-ticket-management\/([^/]+)\/edit/);
    const notifTicketId = notifMatch ? notifMatch[1] : null;

    // 🚫 Skip sound if same ticket reply
    if (
      notif.type === 'ticket_reply' &&
      currentTicketId &&
      notifTicketId &&
      currentTicketId === notifTicketId
    ) {
      console.log('🔇 Skipping sound for same ticket reply');
      return;
    }

    // ✅ Otherwise play
    const audio = new Audio('/NotificationSound.mp3');
    audio.play().catch((err) => console.warn('Audio play blocked:', err));
  };


  const handleLogout = () => {
    clearInterval(window.notificationInterval); // 🛑 stop auto-refresh
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    navigate('/admin/login', { state: { message: 'Logged out successfully.' } });
  };


    useEffect(() => {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 5000);
      window.notificationInterval = interval;
      return () => clearInterval(interval);
    }, [isMuted]);


  // ✅ Toggle mute/unmute
  const toggleMute = () => {
    const newMuteState = !isMuted;
    setIsMuted(newMuteState);
    localStorage.setItem(muteKey, newMuteState);
  };



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
        setNotifications((prev) => {
          const prevIds = new Set(prev.map(n => n.id));
          const newOnes = data.results.filter(n => !prevIds.has(n.id));

          if (newOnes.length > 0) {
            newOnes.forEach(notif => playNotificationSound(notif));
          }

          return data.results;
        });
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
              <Link to="#" onClick={() => window.location.reload()}>
                <img src={`/user/images/logo.png`} className="navbar-logo" alt="logo-static" />
              </Link>
            </li>
          </ul>

          <Link href="javascript:void(0);" data-click="1" className="sidebarCollapse sidebar_collapse_btn" id="navbtn" data-placement="bottom"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-list"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3" y2="6"></line><line x1="3" y1="12" x2="3" y2="12"></line><line x1="3" y1="18" x2="3" y2="18"></line></svg></Link>

          <ul className="navbar-item flex-row search-ul">

          </ul>
          <ul className="navbar-item flex-row navbar-dropdown">

            {/* START OF NOTIFICATIONS DROPDOWN */}
            <li className="nav-item dropdown" ref={notificationsRef}>
              {/* Notification Bell/Toggle */}
              <Link
                className="nav-link dropdown-toggle position-relative p-0" // position-relative for badge positioning
                to='#'
                role="button"
                onClick={(e) => {
                  e.preventDefault();
                  setIsNotificationsOpen(!isNotificationsOpen);
                  if (!isNotificationsOpen) {
                    fetchNotifications();
                  }
                }}
                aria-expanded={isNotificationsOpen}
              >
                <img src={`/user/images/notifications.svg`} className="img-fluid" alt="Notifications" />
                {unreadCount > 0 && (
                  <span className="badge rounded-pill bg-danger position-absolute top-0 start-100 translate-middle">
                    {unreadCount}
                    <span className="visually-hidden">new notifications</span>
                  </span>
                )}
              </Link>

              {/* Notification Dropdown Menu: FIX APPLIED HERE */}
              {isNotificationsOpen && (
                <ul
                  className="dropdown-menu show shadow-lg" // ⬅️ ADDED `dropdown-menu-end` to align to the right!
                  style={{
                    minWidth: '300px',
                    maxHeight: '400px',
                    overflowY: 'auto',
                    right: 0,
                    left: 'auto'
                  }}

                >
                  {/* Header with 'Mark all as read' button */}
                  <li className="d-flex justify-content-between align-items-center p-3 border-bottom">
                    <h6 className="mb-0 fw-bold">
                      <a href='#' onClick={toggleMute}
                        title={isMuted ? 'Unmute notifications' : 'Mute notifications'}
                      >
                        {isMuted ? '🔇' : '🔊'}
                        Notifications
                      </a>
                    </h6>
                    <button
                      onClick={markAllAsRead}
                      className="btn btn-sm btn-link p-0 text-primary"
                      disabled={unreadCount === 0}
                    >
                      Mark all as read
                    </button>
                  </li>

                  {/* List of notifications */}
                  {notifications.length > 0 ? (
                    notifications.map(notif => (
                      <li key={notif.id} className="border-bottom">
                        <Link
                          className={`dropdown-item d-flex justify-content-between align-items-start py-2 text-decoration-none ${notif.is_read ? 'bg-light' : 'bg-white fw-bold'}`}
                          to={notif.link || '#'}
                          onClick={(e) => {
                            if (!notif.link) {
                              e.preventDefault();
                            }
                            markAsRead(notif.id);
                          }}
                        >
                          {/* Notification Content */}
                          <div className="me-3">
                            <div className={`${notif.is_read ? 'text-secondary' : 'text-dark'}`}>{notif.title}</div>
                            <small className="text-muted d-block text-wrap" style={{ fontSize: '0.85rem' }}>
                              {notif.message.length > 60 ? notif.message.substring(0, 60) + '...' : notif.message}
                            </small>
                            <small className="text-info mt-1 d-block" style={{ fontSize: '0.75rem' }}>
                              {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                            </small>
                          </div>

                          {/* Delete button */}
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              deleteNotification(notif.id);
                            }}
                            className="btn btn-sm  border-0 p-0 ms-auto flex-shrink-0"
                            title="Delete Notification"
                          >
                            {/* Using a standard Bootstrap icon for simplicity */}
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-x-circle" viewBox="0 0 16 16">
                              <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
                              <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z" />
                            </svg>
                          </button>
                        </Link>
                      </li>
                    ))
                  ) : (
                    <li>
                      <span className="dropdown-item text-center text-muted">No new notifications.</span>
                    </li>
                  )}
                </ul>
              )}
            </li>
            {/* END OF NOTIFICATIONS DROPDOWN */}


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
                  <Link to='/admin/profile'>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-user"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg> <span>My Profile</span>
                  </Link>
                </div>
                <div className="dropdown-item">
                  <Link to='/admin/change-password'>
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

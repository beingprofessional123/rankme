import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

const DashboardHeader = ({ username, image }) => {
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const notificationsRef = useRef();
    const profileRef = useRef();

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('hotel_info');
        window.location.href = '/login';
    };

    const fetchNotifications = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;
        try {
            const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/notifications`, {
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
        const token = localStorage.getItem('token');
        try {
            await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/notifications/${id}/read`, {
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
        const token = localStorage.getItem('token');
        try {
            const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/notifications/${id}`, {
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
        const token = localStorage.getItem('token');
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

    // Fetch notifications when the component mounts
    useEffect(() => {
        fetchNotifications();
    }, []);

    const unreadCount = notifications.filter(notif => !notif.is_read).length;

    return (
        <div className="topbar">
            {/* ... (existing code for welcome user and topbar-right) ... */}
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
                                <div className="mobile-logo">
                                    <Link to="/dashboard"><img src={`/user/images/logo.svg`} className="img-fluid" alt="RankMeOne Logo" /></Link>
                                </div>
                                <ul className="navbar-nav ms-auto">
                                    {/* Notifications Dropdown */}
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
                                    {/* ... (existing Profile Dropdown and other list items) ... */}
                                    <li className="nav-item dropdown profiledrop" ref={profileRef}>
                                        <Link
                                            className="nav-link dropdown-toggle"
                                            to=''
                                            role="button"
                                            onClick={() => setIsProfileOpen(!isProfileOpen)}
                                            aria-expanded={isProfileOpen}
                                        >
                                            <img
                                                src={image ? image : `/user/images/no-image.webp`}
                                                className="img-fluid rounded-circle"
                                                alt="User Profile"
                                            />
                                        </Link>
                                        {isProfileOpen && (
                                            <ul className="dropdown-menu show">
                                                <li>
                                                    <Link className="dropdown-item" to='/settings'>
                                                        <img src={`/user/images/setting.svg`} className="img-fluid" alt="Settings" />Settings
                                                    </Link>
                                                </li>
                                                <li>
                                                    <Link className="dropdown-item" to='' onClick={handleLogout}>
                                                        <img src={`/user/images/logout.svg`} className="img-fluid" alt="Logout" />Logout
                                                    </Link>
                                                </li>
                                            </ul>
                                        )}
                                    </li>
                                    <li className="menuicon" id="menuicon">
                                        <button>
                                            <img src={`/user/images/Menu.svg`} className="img-fluid" alt="Menu" />
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
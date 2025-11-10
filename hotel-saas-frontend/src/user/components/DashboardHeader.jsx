import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

const DashboardHeader = ({ username, image }) => {
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [isMuted, setIsMuted] = useState(
        localStorage.getItem('NotificationSoundisMutedRankmeUser') === 'true'
    );
    const notificationsRef = useRef();
    const profileRef = useRef();
    const lastNotifIdsRef = useRef(new Set());
    const audioRef = useRef(new Audio('/NotificationSound.mp3'));

    const handleLogout = () => {
        if (window.notificationInterval) {
            clearInterval(window.notificationInterval);
            window.notificationInterval = null;
        }
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('hotel_info');
        window.location.href = '/login';
    };

    const toggleMute = () => {
        const newMutedState = !isMuted;
        setIsMuted(newMutedState);
        localStorage.setItem('NotificationSoundisMutedRankmeUser', newMutedState);
    };

    // ✅ Handle notification sound logic with support ticket check
    const playNotificationSound = (notif) => {
        const currentUrl = window.location.href;
        const isMuted = localStorage.getItem('NotificationSoundisMutedRankmeUser') === 'true';

        if (isMuted) return;

        // Extract ticket ID from current URL
        const currentMatch = currentUrl.match(/\/support-tickets-edit\/([^/]+)/);
        const currentTicketId = currentMatch ? currentMatch[1] : null;

        // Extract ticket ID from notification link
        const notifMatch = notif?.link?.match(/\/support-tickets-edit\/([^/]+)/);
        const notifTicketId = notifMatch ? notifMatch[1] : null;

        // Skip sound if same ticket reply
        if (
            notif.type === 'ticket_new_reply' &&
            currentTicketId &&
            notifTicketId &&
            currentTicketId === notifTicketId
        ) {
            console.log('🔇 Muted ticket reply for current page');
            return;
        }

        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(err => console.warn('Audio blocked:', err));
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
                setNotifications((prev) => {
                    const currentIds = new Set(data.results.map(n => n.id));
                    const prevIds = lastNotifIdsRef.current;

                    const newOnes = data.results.filter(n => !prevIds.has(n.id));

                    // ✅ Only play sound for actual new notifications
                    if (newOnes.length > 0 && prevIds.size > 0) {
                        newOnes.forEach(notif => playNotificationSound(notif));
                    }

                    lastNotifIdsRef.current = currentIds;
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

    useEffect(() => {
        // ✅ Ensure localStorage key exists
        const muteKey = 'NotificationSoundisMutedRankmeUser';
        if (localStorage.getItem(muteKey) === null) {
            localStorage.setItem(muteKey, 'true'); // Default muted
        }

        // ✅ Fetch notifications periodically
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 5000);
        return () => clearInterval(interval);
    }, [isMuted]);


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
                                                <li className="notification-actions d-flex justify-content-between align-items-center  border-bottom">
                                                    <a href='#'
                                                        onClick={toggleMute}
                                                        className="btn btn-link text-dark"
                                                        title={isMuted ? 'Unmute notifications' : 'Mute notifications'}
                                                    >
                                                        {isMuted ? '🔇' : '🔊'}
                                                        Notifications
                                                    </a>

                                                    <li className="read-all-btn-wrapper">
                                                        <button onClick={markAllAsRead} className="btn btn-link w-100 text-end">
                                                            Mark all as read
                                                        </button>
                                                    </li>
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
                                                    <li className="no-notifications text-center">
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
                                                src={image ? image : `${process.env.REACT_APP_BASE_URL}/user/images/no-image.webp`}
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
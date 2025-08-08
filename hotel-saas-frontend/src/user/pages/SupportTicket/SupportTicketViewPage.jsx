import React, { useState, useEffect, useContext, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import { PermissionContext } from '../../UserPermission'; // Assuming you have this context
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:4000';

const SupportTicketViewPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useContext(PermissionContext); // Get the current user from context

    const [ticket, setTicket] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const chatboxRef = useRef(null);
    
    // Retrieve and parse the user data once when the component loads
    const loggedInUser = JSON.parse(localStorage.getItem('user'));

    useEffect(() => {
        const fetchTicketDetails = async () => {
            setLoading(true);
            setError(null);
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get(`${API_BASE_URL}/api/support-ticket/${id}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                const fetchedTicket = response.data.ticket;

                const formattedTicket = {
                    ...fetchedTicket,
                    date: fetchedTicket.createdAt ? new Date(fetchedTicket.createdAt).toLocaleDateString() : 'N/A'
                };
                
                setTicket(formattedTicket);
            } catch (err) {
                console.error("Failed to fetch ticket details:", err);
                setError('Failed to load ticket details. Please check the ticket ID and your permissions.');
                setTicket(null);
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchTicketDetails();
        } else {
            setLoading(false);
            setError('No ticket ID provided in the URL.');
        }
    }, [id]);

    useEffect(() => {
        if (chatboxRef.current) {
            chatboxRef.current.scrollTop = chatboxRef.current.scrollHeight;
        }
    }, [ticket]);

    const getInitials = (name) => {
        if (!name) return '??';
        const parts = name.split(' ');
        if (parts.length > 1) {
            return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
        }
        return parts[0][0].toUpperCase();
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="mainbody">
                    <div className="container-fluid">
                        <div className="text-center p-5">
                            <p>Loading ticket details...</p>
                        </div>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    if (error || !ticket) {
        return (
            <DashboardLayout>
                <div className="mainbody">
                    <div className="container-fluid">
                        <div className="alert alert-danger mt-5">
                            {error || 'No ticket data found.'} Please go back to the{' '}
                            <Link to="/support-tickets">Support Tickets</Link> page.
                        </div>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="mainbody">
                <div className="container-fluid">
                    <div className="row breadcrumbrow">
                        <div className="col-md-12">
                            <div className="breadcrumb-sec">
                                <h2>View Support Ticket</h2>
                                <nav aria-label="breadcrumb">
                                    <ol className="breadcrumb">
                                        <li className="breadcrumb-item">
                                            <Link to="/support-tickets">Home</Link>
                                        </li>
                                        <li className="breadcrumb-item active" aria-current="page">
                                            View Ticket
                                        </li>
                                    </ol>
                                </nav>
                            </div>
                        </div>
                    </div>

                    <div className="white-bg p-4">
                        <dl className="row">
                            <dt className="col-sm-3">Subject</dt>
                            <dd className="col-sm-9">{ticket.subject}</dd>

                            <dt className="col-sm-3">Category</dt>
                            <dd className="col-sm-9">{ticket.category}</dd>

                            <dt className="col-sm-3">Opened Date</dt>
                            <dd className="col-sm-9">{ticket.date}</dd>

                            <dt className="col-sm-3">Status</dt>
                            <dd className="col-sm-9">{ticket.status}</dd>

                            {ticket.creator && (
                                <>
                                    <dt className="col-sm-3">Creator</dt>
                                    <dd className="col-sm-9">{ticket.creator.name} ({ticket.creator.email})</dd>
                                </>
                            )}
                            {ticket.assignee && (
                                <>
                                    <dt className="col-sm-3">Assigned To</dt>
                                    <dd className="col-sm-9">{ticket.assignee.name} ({ticket.assignee.email})</dd>
                                </>
                            )}

                            <dt className="col-sm-3">Description</dt>
                            <dd className="col-sm-9">{ticket.description}</dd>
                            
                            {ticket.fileAttachmentPath && (
                                <>
                                    <dt className="col-sm-3">Attachment</dt>
                                    <dd className="col-sm-9">
                                        <a href={`${API_BASE_URL}${ticket.fileAttachmentPath}`} target="_blank" rel="noopener noreferrer">View Attachment</a>
                                    </dd>
                                </>
                            )}
                        </dl>
                    </div>

                    <div className="white-bg p-4">
                        <div className="supportchat">
                            <div className="supportchat-heading">
                                <h2>Chat</h2>
                            </div>
                            <div className="chatbox" ref={chatboxRef}>
                                <ul className="chatboxul">
                                    {ticket.messages && ticket.messages.length > 0 ? (
                                        ticket.messages.map(message => {
                                            const isCurrentUser = user && message.sender.id === user.id;
                                            
                                            // Determine which user object to use for avatar logic
                                            const senderData = isCurrentUser ? loggedInUser : message.sender;

                                            const senderName = senderData?.name || 'User';
                                            const senderInitials = getInitials(senderName);
                                            const formattedTime = new Date(message.createdAt).toLocaleString();
                                            
                                            // Avatar logic
                                            let avatarContent;
                                            const avatarUrl = senderData?.company?.logo_url || senderData?.profile_image;

                                            if (avatarUrl) {
                                                avatarContent = <img src={`${avatarUrl}`} alt={`${senderName} avatar`} />;
                                            } else {
                                                avatarContent = <span>{senderInitials}</span>;
                                            }

                                            return (
                                                <li key={message.id} className={`chatbox-li ${isCurrentUser ? 'chatbox-li-right' : ''}`}>
                                                    <div className="chatbox-admin">
                                                        {avatarContent}
                                                    </div>
                                                    <div className="chatbox-message">
                                                        <p>{message.message}</p>
                                                        {message.fileAttachmentPath && (
                                                            <a href={`${API_BASE_URL}${message.fileAttachmentPath}`} target="_blank" rel="noopener noreferrer" className="attachment-link">
                                                                <i className="la la-paperclip"></i> Attachment
                                                            </a>
                                                        )}
                                                        <span className="chat-timestamp">{formattedTime}</span>
                                                    </div>
                                                </li>
                                            );
                                        })
                                    ) : (
                                        <li className="text-center text-muted p-3">No messages in this thread yet.</li>
                                    )}
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div className="mt-3">
                        <button
                            className="btn btn-secondary me-2"
                            onClick={() => navigate('/support-tickets')}
                        >
                            Back to Tickets
                        </button>
                        <button
                            className="btn btn-primary"
                            onClick={() => navigate(`/support-tickets-edit/${ticket._id}`)}
                        >
                            Edit Ticket
                        </button>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default SupportTicketViewPage;
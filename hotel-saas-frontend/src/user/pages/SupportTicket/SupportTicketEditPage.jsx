// SupportTicketUnifiedPage.js
import React, { useEffect, useState, useContext, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import { PermissionContext } from '../../UserPermission';
import axios from 'axios';
import Swal from 'sweetalert2';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:4000';

// Define the static categories here
const CATEGORY_OPTIONS = [
    'Technical Issue',
    'Feature Request',
    'Billing Inquiry',
    'General Question',
    'Bug Report',
    'Access Problem'
];

const loggedInUser = JSON.parse(localStorage.getItem('user'));
const SupportTicketUnifiedPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { permissions, role, user } = useContext(PermissionContext);
    const isCompanyAdmin = role?.name === 'company_admin';
    const canEditTicket = (action) => {
        if (isCompanyAdmin) return true;
        return permissions?.support_ticket?.[action] === true;
    };

    const [ticket, setTicket] = useState(null);
    const [formData, setFormData] = useState({
        subject: '',
        category: '',
        description: '',
        status: '',
        createdAt: '',
    });
    const [messageData, setMessageData] = useState({
        message: '',
        file: null,
    });
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [messageSending, setMessageSending] = useState(false);
    const [error, setError] = useState(null);

    const chatboxRef = useRef(null);

    // Function to fetch the existing ticket data
    const fetchTicket = async () => {
        if (!id) {
            setLoading(false);
            setError('No ticket ID provided.');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_BASE_URL}/api/support-ticket/${id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const ticketData = response.data.ticket;
            // Sort messages by createdAt timestamp
            const sortedMessages = ticketData.messages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
            setTicket({ ...ticketData, messages: sortedMessages });

            setFormData({
                subject: ticketData.subject || '',
                category: ticketData.category || '',
                description: ticketData.description || '',
                status: ticketData.status || 'Open',
                createdAt: ticketData.createdAt ? new Date(ticketData.createdAt).toISOString().split('T')[0] : '',
            });
        } catch (err) {
            console.error("Failed to fetch ticket details:", err);
            setError('Failed to load ticket details.');
            setTicket(null);
        } finally {
            setLoading(false);
        }
    };

    // Auto-refresh messages every 5 seconds
    useEffect(() => {
        fetchTicket();

        const intervalId = setInterval(() => {
            fetchTicket();
        }, 5000);

        // Cleanup function to clear the interval when the component unmounts
        return () => clearInterval(intervalId);
    }, [id]);

    useEffect(() => {
        if (chatboxRef.current) {
            chatboxRef.current.scrollTop = chatboxRef.current.scrollHeight;
        }
    }, [ticket]);

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        try {
            const token = localStorage.getItem('token');
            await axios.put(`${API_BASE_URL}/api/support-ticket/${id}`, formData, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            Swal.fire('Success!', 'Ticket updated successfully.', 'success');
            fetchTicket(); // Refresh the ticket data to reflect changes
        } catch (err) {
            console.error('Failed to update ticket:', err);
            const errorMessage = err.response?.data?.message || 'An unexpected error occurred. Please try again.';
            Swal.fire('Error!', errorMessage, 'error');
            setError(errorMessage);
        } finally {
            setSubmitting(false);
        }
    };
    
    const handleMessageChange = (e) => {
        const { name, value, files } = e.target;
        if (name === 'file') {
            setMessageData(prev => ({ ...prev, file: files[0] }));
        } else {
            setMessageData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleMessageSubmit = async (e) => {
        e.preventDefault();
        setMessageSending(true);

        // --- VALIDATION PART ---
        const { message, file } = messageData;

        // Message length validation
        if (!message.trim() && !file) {
            Swal.fire('Error!', 'Please provide a message or attach a file.', 'error');
            setMessageSending(false);
            return;
        }

        // File validation (same as add page)
        if (file) {
            const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
            const maxSize = 2 * 1024 * 1024; // 2 MB

            if (!allowedTypes.includes(file.type)) {
                Swal.fire('Error!', 'Invalid file type. Only JPG, JPEG, and PNG are allowed.', 'error');
                setMessageData(prev => ({ ...prev, file: null }));
                setMessageSending(false);
                return;
            }

            if (file.size > maxSize) {
                Swal.fire('Error!', 'File size exceeds the 2MB limit.', 'error');
                setMessageData(prev => ({ ...prev, file: null }));
                setMessageSending(false);
                return;
            }
        }
        // --- END OF VALIDATION ---

        const data = new FormData();
        data.append('message', message);
        if (file) {
            data.append('threadFile', file);
        }
        
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${API_BASE_URL}/api/support-ticket/${id}/message`, data, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data',
                },
            });

            Swal.fire('Success!', 'Message sent successfully.', 'success');
            setMessageData({ message: '', file: null });
            fetchTicket(); // Refresh the ticket to show the new message
        } catch (err) {
            console.error('Failed to send message:', err);
            const errorMessage = err.response?.data?.message || 'An unexpected error occurred. Please try again.';
            Swal.fire('Error!', errorMessage, 'error');
        } finally {
            setMessageSending(false);
        }
    };

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
    
    // Check if the ticket is closed
    const isTicketClosed = ticket.status === 'Closed';

    return (
        <DashboardLayout>
            <div className="mainbody">
                <div className="container-fluid">
                    <div className="row breadcrumbrow">
                        <div className="col-md-12">
                            <div className="breadcrumb-sec">
                                <h2>Edit Support Ticket</h2>
                                <nav aria-label="breadcrumb">
                                    <ol className="breadcrumb">
                                        <li className="breadcrumb-item">
                                            <Link to="/support-tickets">Home</Link>
                                        </li>
                                        <li className="breadcrumb-item active" aria-current="page">
                                            Edit Ticket
                                        </li>
                                    </ol>
                                </nav>
                            </div>
                        </div>
                    </div>
                    {/* --- TICKET DETAILS SECTION --- */}
                    <div className="white-bg p-4 mb-5">
                        <div className="form-design">
                            <h4>Ticket Details</h4>
                            <div className="row">
                                {/* Subject */}
                                <div className="col-md-6">
                                    <div className="form-group">
                                        <label className="form-label">Subject</label>
                                        <p className="form-control-static">{ticket.subject}</p>
                                    </div>
                                </div>
                                {/* Category */}
                                <div className="col-md-6">
                                    <div className="form-group">
                                        <label className="form-label">Category</label>
                                        <p className="form-control-static">{ticket.category}</p>
                                    </div>
                                </div>
                                {/* Date */}
                                <div className="col-md-6">
                                    <div className="form-group">
                                        <label className="form-label">Date</label>
                                        <p className="form-control-static">
                                            {ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString() : ''}
                                        </p>
                                    </div>
                                </div>
                                {/* Status */}
                                <div className="col-md-6">
                                    <div className="form-group">
                                        <label className="form-label">Status</label>
                                        <p className="form-control-static">{ticket.status}</p>
                                    </div>
                                </div>
                                {/* Description */}
                                <div className="col-md-12">
                                    <div className="form-group">
                                        <label className="form-label">Description</label>
                                        <p className="form-control-static">{ticket.description}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* --- CHAT SYSTEM SECTION --- */}
                    <div className="white-bg">
                        <div className="supportchat">
                            <div className="supportchat-heading">
                                <h2>Chat</h2>
                            </div>
                            <div className="chatbox" ref={chatboxRef}>
                                <ul className="chatboxul">
                                    {ticket.messages && ticket.messages.length > 0 ? (
                                        ticket.messages.map(message => {
                                            const isCurrentUser = user && message.sender.id === user.id;
                                            const senderData = isCurrentUser ? loggedInUser : message.sender;
                                            const senderName = message.sender.name || 'User';
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
                                                <li key={message._id} className={`chatbox-li ${isCurrentUser ? 'chatbox-li-right' : ''}`}>
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
                            <div className="textareaboxfix">
                                {isTicketClosed ? (
                                    <div className="alert alert-warning text-center m-0">
                                        This ticket is closed. No further replies can be sent.
                                    </div>
                                ) : (
                                    <div className="textareabox">
                                        <form onSubmit={handleMessageSubmit} className="input-group">
                                            <input
                                                type="text"
                                                className="form-control"
                                                placeholder="Type a message.."
                                                name="message"
                                                value={messageData.message}
                                                onChange={handleMessageChange}
                                            />
                                            <label className="btn btn-danger">
                                                <input
                                                    type="file"
                                                    name="file"
                                                    onChange={handleMessageChange}
                                                    style={{ display: 'none' }}
                                                />
                                                <i className="la la-paperclip"></i>
                                            </label>
                                            <button className="btn btn-primary" type="submit" disabled={messageSending}>
                                                <i className="la la-arrow-up"></i>
                                            </button>
                                        </form>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default SupportTicketUnifiedPage;
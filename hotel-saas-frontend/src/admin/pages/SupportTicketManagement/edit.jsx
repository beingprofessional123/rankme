import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';


const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:4000';

const SupportTicketEdit = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [ticketData, setTicketData] = useState(null);
    const [adminList, setAdminList] = useState([]);
    const [form, setForm] = useState({
        status: '',
        newMessage: '',
        fileAttachment: null,
    });
    const [ticketStatus, setTicketStatus] = useState('');
    const fileInputRef = useRef(null);
    const chatboxRef = useRef(null);

    useEffect(() => {
        fetchTicket();
        fetchAdminList();

        // Set up an interval to refresh the ticket data every 5 seconds
        const intervalId = setInterval(fetchTicket, 5000);

        // Clean up the interval when the component unmounts
        return () => clearInterval(intervalId);
    }, [id, ticketStatus]);

    useEffect(() => {
        // Scroll to the bottom of the chatbox whenever messages are updated
        if (chatboxRef.current) {
            chatboxRef.current.scrollTop = chatboxRef.current.scrollHeight;
        }
    }, [ticketData]);

    const fetchTicket = async () => {
        try {
            const token = localStorage.getItem('admin_token');
            const response = await axios.get(
                `${API_BASE_URL}/api/admin/support-ticket/${id}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            const ticket = response.data.ticket;

            if (ticket) {
                // If ticketData is null, this is the initial fetch.
                // Sync both states.
                if (!ticketData) {
                    setTicketStatus(ticket.status || '');
                }
                // Always update the ticket data to get new messages.
                setTicketData(ticket);
            }
        } catch (err) {
            console.error('Error fetching ticket:', err);
            const message = err.response?.data?.message || 'Failed to fetch ticket details.';
            if (err.response?.status !== 404) {
                toast.error(message);
            }
        }
    };

    const fetchAdminList = async () => {
        try {
            const token = localStorage.getItem('admin_token');
            const response = await axios.get(
                `${API_BASE_URL}/api/admin/roles-list`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            const admins = response.data.results.filter(role =>
                role.name === 'admin' || role.name === 'super_admin'
            ).flatMap(role => role.Users);

            setAdminList(admins || []);
        } catch (err) {
            console.error('Failed to fetch admin list:', err);
        }
    };

    const handleChange = (e) => {
        const { name, value, files } = e.target;
        if (name === 'fileAttachment') {
            const file = files[0];
            if (file) {
                // Check file size (max 2MB)
                if (file.size > 2 * 1024 * 1024) {
                    toast.error('File size exceeds the 2MB limit.');
                    if (fileInputRef.current) {
                        fileInputRef.current.value = ''; // Clear the input
                    }
                    return;
                }
                // Check file type
                const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
                if (!allowedTypes.includes(file.type)) {
                    toast.error('Only PNG, JPG, and JPEG file types are allowed.');
                    if (fileInputRef.current) {
                        fileInputRef.current.value = ''; // Clear the input
                    }
                    return;
                }
                setForm((prev) => ({ ...prev, [name]: file }));
            }
        } else if (name === 'status') {
            setTicketStatus(value); // Updates the new state variable
        }else {
            setForm((prev) => ({ ...prev, [name]: value }));
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

    const handleReply = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('admin_token');
        const formData = new FormData();

        // Only append if the status has actually changed
        if (ticketStatus !== ticketData.status) {
            formData.append('status', ticketStatus);
        }
        if (form.newMessage) {
            formData.append('message', form.newMessage);
        }
        if (form.fileAttachment) {
            formData.append('fileAttachment', form.fileAttachment);
        }

        // Prevent API call if nothing has changed
        if (Array.from(formData.entries()).length === 0) {
            toast.info('No changes to save.');
            return;
        }

        try {
            const response = await axios.put(
                `${API_BASE_URL}/api/admin/support-ticket/${id}`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (response.data.status) {
                toast.success(response.data.message || 'Ticket updated successfully.');
                setForm({
                    newMessage: '',
                    fileAttachment: null,
                });
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
                fetchTicket(); // Refresh to show the new reply and reflect the status change
            } else {
                toast.error(response.data.message || 'Failed to update ticket.');
            }
        } catch (err) {
            console.error('Error updating ticket:', err);
            toast.error(err.response?.data?.message || 'An unexpected error occurred');
        }
    };

    if (!ticketData) {
        return (
            <div className="layout-px-spacing">
                <div className="text-center mt-5">Loading ticket details...</div>
            </div>
        );
    }

    // Sort messages by createdAt timestamp before rendering
    const sortedMessages = ticketData.messages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    return (
        <div className="layout-px-spacing">
            <div className="page-header d-flex justify-content-between">
                <div className="page-title">
                    <h3>Ticket #{ticketData.ticketNumber}: {ticketData.subject}</h3>
                </div>
                <div className="page-title page-btn">
                    <Link className="btn btn-primary" to="/admin/support-ticket-management">Back to Tickets</Link>
                </div>
            </div>
            <div className="row layout-top-spacing">
                <div className="col-xl-12 col-lg-12 col-md-12 layout-spacing">
                    {/* --- TICKET DETAILS AND CONTROLS SECTION --- */}
                    <div className="section general-infomain">
                        <div className="account-content mt-2 mb-2">
                            <div className="row">
                                <div className="white-bg p-4 mb-5">
                                    <div className="form-design">
                                        <div className="supportchat-heading">
                                            <h2>Details</h2>
                                        </div>
                                        <div className="row">
                                            {/* Subject */}
                                            <div className="col-md-6">
                                                <div className="form-group">
                                                    <label className="form-label">Subject</label>
                                                    <p className="form-control-static">{ticketData.subject}</p>
                                                </div>
                                            </div>
                                            {/* Category */}
                                            <div className="col-md-6">
                                                <div className="form-group">
                                                    <label className="form-label">Category</label>
                                                    <p className="form-control-static">{ticketData.category}</p>
                                                </div>
                                            </div>
                                            {/* priority */}
                                            <div className="col-md-6">
                                                <div className="form-group">
                                                    <label className="form-label">Priority</label>
                                                    <p className="form-control-static">{ticketData.priority}</p>
                                                </div>
                                            </div>
                                            {/* Date */}
                                            <div className="col-md-6">
                                                <div className="form-group">
                                                    <label className="form-label">Date</label>
                                                    <p className="form-control-static">
                                                        {ticketData.createdAt ? new Date(ticketData.createdAt).toLocaleDateString() : ''}
                                                    </p>
                                                </div>
                                            </div>
                                            {/* Description */}
                                            <div className="col-md-6">
                                                <div className="form-group">
                                                    <label className="form-label">Description</label>
                                                    <p className="form-control-static">{ticketData.description}</p>
                                                </div>
                                            </div>
                                            {/* Status Controls */}
                                            <div className="col-md-6">
                                                <div className="form-group">
                                                    <label htmlFor="status" className="form-label">Status</label>
                                                    <select
                                                        id="status"
                                                        name="status"
                                                        className="form-control"
                                                        value={ticketStatus}
                                                        onChange={handleChange}
                                                        required
                                                    >
                                                        <option value="Open">Open</option>
                                                        <option value="In Progress">In Progress</option>
                                                        <option value="Closed">Closed</option>
                                                    </select>
                                                </div>
                                                <div className="form-group mt-3">
                                                    <button type="button" onClick={handleReply} className="btn btn-primary w-100">
                                                        Update Ticket Details
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* --- CHAT SYSTEM SECTION --- */}
            <div className="row layout-top-spacing">
                <div className="col-xl-12 col-lg-12 col-md-12 layout-spacing">
                    <div className="section general-infomain">
                        <div className="account-content mt-2 mb-2">
                            <div className="row">
                                <div className="white-bg">
                                    <div className="supportchat">
                                        <div className="supportchat-heading">
                                            <h2>Chat</h2>
                                        </div>
                                        <div className="chatbox" ref={chatboxRef}>
                                            <ul className="chatboxul">
                                                {sortedMessages && sortedMessages.length > 0 ? (
                                                    sortedMessages.map((message) => {
                                                        const formattedTime = new Date(message.createdAt).toLocaleString();
                                                        const isTicketCreator = message.senderId === ticketData.creator.id;

                                                        const avatarContent = isTicketCreator ? (
                                                            <span>{getInitials(ticketData.creator.name)}</span>
                                                        ) : (
                                                            <span>Ad</span>
                                                        );

                                                        return (
                                                            <li key={message.id} className={`chatbox-li ${!isTicketCreator ? 'chatbox-li-right' : ''}`}>
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
                                            <div className="textareabox">
                                                <form onSubmit={handleReply} className="input-group">
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        placeholder="Type a message.."
                                                        name="newMessage"
                                                        value={form.newMessage}
                                                        onChange={handleChange}
                                                    />
                                                    <label className="btn btn-danger">
                                                        <input
                                                            type="file"
                                                            name="fileAttachment"
                                                            id="fileAttachment"
                                                            className="form-control"
                                                            onChange={handleChange}
                                                            style={{ display: 'none' }}
                                                            ref={fileInputRef}
                                                            accept=".png, .jpg, .jpeg"
                                                        />
                                                        <i className="la la-paperclip"></i>
                                                    </label>
                                                    <button className="btn btn-primary" type="submit">
                                                        <i className="la la-arrow-up"></i>
                                                    </button>
                                                </form>
                                            </div>
                                            {form.fileAttachment && (
                                                <div className="d-flex justify-content-between align-items-center mt-2 px-3">
                                                    <p className="mb-0 text-muted small">
                                                        Selected file: <strong>{form.fileAttachment.name}</strong>
                                                    </p>
                                                    <button
                                                        type="button"
                                                        className="btn btn-sm btn-outline-danger"
                                                        onClick={() => {
                                                            setForm(prev => ({ ...prev, fileAttachment: null }));
                                                            if (fileInputRef.current) {
                                                                fileInputRef.current.value = '';
                                                            }
                                                        }}
                                                    >
                                                        Remove
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SupportTicketEdit;
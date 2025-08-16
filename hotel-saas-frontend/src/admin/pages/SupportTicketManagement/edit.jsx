import React, { useEffect, useState, useRef} from 'react';
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
        assigneeId: '',
        newMessage: '',
        fileAttachment: null,
    });
    const fileInputRef = useRef(null);

    useEffect(() => {
        fetchTicket();
        fetchAdminList();
    }, [id]);

    const fetchTicket = async () => {
        try {
            const token = localStorage.getItem('admin_token');
            const response = await axios.get(
                `${API_BASE_URL}/api/admin/support-ticket/${id}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            const ticket = response.data.ticket;

            if (ticket) {
                setTicketData(ticket);
                setForm({
                    ...form,
                    status: ticket.status || '',
                    assigneeId: ticket.assigneeId?._id || '', // Use `_id` to get the assignee's ID
                    // Ensure the reply form fields are empty when the ticket is loaded
                    newMessage: '',
                    fileAttachment: null,
                });
            }
        } catch (err) {
            console.error('Error fetching ticket:', err);
            const message = err.response?.data?.message || 'Failed to fetch ticket details.';
            toast.error(message);
        }
    };

    const fetchAdminList = async () => {
        try {
            const token = localStorage.getItem('admin_token');
            const response = await axios.get(
                `${API_BASE_URL}/api/admin/roles-list`, // Assuming this endpoint returns roles with associated users
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
            setForm((prev) => ({ ...prev, [name]: files[0] }));
        } else {
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

        // Always append status and assigneeId, even if they haven't changed
        formData.append('status', form.status);
        formData.append('assigneeId', form.assigneeId);
        
        // Only append newMessage if it exists
        if (form.newMessage) {
            formData.append('message', form.newMessage);
        }
        
        // Only append fileAttachment if it exists
        if (form.fileAttachment) {
            formData.append('fileAttachment', form.fileAttachment);
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
                toast.success(response.data.message || 'Ticket updated and reply sent successfully');
                
                // This is the correct way to reset the form state
                setForm((prev) => ({
                    ...prev,
                    newMessage: '', // Clear the message
                    fileAttachment: null // Clear the file
                }));

                // This line is crucial for clearing the file input in the DOM.
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }

                fetchTicket(); // Refresh the ticket data to show the new message
            } else {
                toast.error(response.data.message || 'Failed to send reply');
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

    return (
        <div className="layout-px-spacing">
            <div className="page-header d-flex justify-content-between">
                <div className="page-title">
                    <h3>Ticket #{ticketData.ticketNumber}: {ticketData.subject}</h3>
                </div>
                <div className="page-title page-btn">
                    <Link className="btn btn-primary" to="/admin/support-ticket">Back to Tickets</Link>
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
                                            <h2>Chat</h2>
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
                                            {/* Date */}
                                            <div className="col-md-6">
                                                <div className="form-group">
                                                    <label className="form-label">Date</label>
                                                    <p className="form-control-static">
                                                        {ticketData.createdAt ? new Date(ticketData.createdAt).toLocaleDateString() : ''}
                                                    </p>
                                                </div>
                                            </div>
                                            {/* Status and Assignee Controls */}
                                            <div className="col-md-6">
                                                <div className="form-group">
                                                    <label htmlFor="status" className="form-label">Status</label>
                                                    <select
                                                        id="status"
                                                        name="status"
                                                        className="form-control"
                                                        value={form.status}
                                                        onChange={handleChange}
                                                        required
                                                    >
                                                        <option value="Open">Open</option>
                                                        <option value="In Progress">In Progress</option>
                                                        <option value="Closed">Closed</option>
                                                    </select>
                                                </div>
                                                {/* <div className="form-group mt-3">
                                                    <label htmlFor="assigneeId" className="form-label">Assignee</label>
                                                    <select
                                                        id="assigneeId"
                                                        name="assigneeId"
                                                        className="form-control"
                                                        value={form.assigneeId}
                                                        onChange={handleChange}
                                                    >
                                                        <option value="">Unassigned</option>
                                                        {adminList.map((admin) => (
                                                            <option key={admin._id} value={admin._id}>
                                                                {admin.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div> */}
                                                <div className="form-group mt-3">
                                                    <button type="button" onClick={handleReply} className="btn btn-primary w-100">
                                                        Update Ticket Details
                                                    </button>
                                                </div>
                                            </div>
                                            {/* Description */}
                                            <div className="col-md-12">
                                                <div className="form-group">
                                                    <label className="form-label">Description</label>
                                                    <p className="form-control-static">{ticketData.description}</p>
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
                                        <div className="chatbox">
                                            <ul className="chatboxul">
                                                {ticketData.messages && ticketData.messages.length > 0 ? (
                                                    ticketData.messages.map((message) => {
                                                        const formattedTime = new Date(message.createdAt).toLocaleString();
                                                        
                                                        // Check if the message sender is the ticket creator
                                                        const isTicketCreator = message.senderId === ticketData.creator.id;
                                                        
                                                        const avatarContent = isTicketCreator ? (
                                                            <span>{getInitials(ticketData.creator.name)}</span> // User's initials
                                                        ) : (
                                                            <span>Ad</span> // Admin avatar
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
                                                        />
                                                        <i className="la la-paperclip"></i>
                                                    </label>
                                                    <button className="btn btn-primary" type="submit">
                                                        <i className="la la-arrow-up"></i>
                                                    </button>
                                                </form>
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
    );
};

export default SupportTicketEdit;
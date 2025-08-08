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
                    assigneeId: ticket.assigneeId || '',
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
                `${API_BASE_URL}/api/admin/roles-list`, // Assuming a similar endpoint to get a list of roles
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

    const handleReply = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('admin_token');
        const formData = new FormData();

        formData.append('status', form.status);
        formData.append('assigneeId', form.assigneeId);
        if (form.newMessage) {
            formData.append('message', form.newMessage);
        }
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
                setForm({
                    status: form.status, // Keep the same status
                    assigneeId: form.assigneeId, // Keep the same assignee
                    newMessage: '', // Clear the message
                    fileAttachment: null // Clear the file
                });

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
                    <div className="general-info section general-infomain">
                        <div className="account-content mt-2 mb-2">
                            <div className="row">
                                {/* Left side: Ticket Details and Controls */}
                                <div className="col-xl-4 col-lg-4 col-md-12 layout-spacing">
                                    <div className="widget-content widget-content-area br-6 p-4">
                                        <h4>Ticket Details</h4>
                                        <hr />
                                        <p><strong>Opened By:</strong> {ticketData.creator?.name || 'N/A'}</p>
                                        <p><strong>Email:</strong> {ticketData.creator?.email || 'N/A'}</p>
                                        <p><strong>Category:</strong> {ticketData.category || 'N/A'}</p>
                                        <p><strong>Opened Date:</strong> {new Date(ticketData.createdAt).toLocaleDateString()}</p>
                                        <p><strong>Attachment File:</strong> {ticketData.fileAttachmentPath && (
                                            <a 
                                                href={`${API_BASE_URL}${ticketData.fileAttachmentPath}`} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="d-block mt-2"
                                            >
                                                View Attachment
                                            </a>
                                        )}</p>
                                        <hr />
                                        <form onSubmit={handleReply}>
                                            <div className="form-group mb-3">
                                                <label htmlFor="status">Status</label>
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
                                            <button type="submit" className="btn btn-primary w-100">Update Ticket</button>
                                        </form>
                                    </div>
                                </div>

                                {/* Right side: Chat Thread and Reply Form */}
                                <div className="col-xl-8 col-lg-8 col-md-12 layout-spacing">
                                    <div className="widget-content widget-content-area br-6 p-4 support-ticket-chat-container">
                                        <h4>Chat Thread</h4>
                                        <hr />
                                        <div className="chat-thread">
                                            {ticketData.messages && ticketData.messages.length > 0 ? (
                                                ticketData.messages.map((message) => (
                                                    <div
                                                        key={message.id}
                                                        className={`chat-message ${message.senderId === ticketData.creator.id ? 'admin-message' : 'user-message'}`}
                                                    >
                                                        <div className="chat-bubble">
                                                            <div className="message-header">
                                                                <strong>{message.senderId === ticketData.creator.id ? ticketData.creator.name : 'Admin'}</strong>
                                                                <small className="text-muted ml-2">{new Date(message.createdAt).toLocaleString()}</small>
                                                            </div>
                                                            <p>{message.message}</p>
                                                            {message.fileAttachmentPath && (
                                                                <a 
                                                                    href={`${API_BASE_URL}${message.fileAttachmentPath}`} 
                                                                    target="_blank" 
                                                                    rel="noopener noreferrer"
                                                                    className="d-block mt-2"
                                                                >
                                                                    View Attachment
                                                                </a>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="text-center text-muted">No messages in this thread.</div>
                                            )}
                                        </div>
                                        <hr />
                                        <div className="reply-form mt-4">
                                            <h5>Reply to Ticket</h5>
                                            <form onSubmit={handleReply}>
                                                <div className="form-group mb-2">
                                                    <textarea
                                                        name="newMessage"
                                                        className="form-control"
                                                        rows="3"
                                                        placeholder="Type your message here..."
                                                        value={form.newMessage}
                                                        onChange={handleChange}
                                                    ></textarea>
                                                </div>
                                                <div className="form-group mb-2">
                                                    <label htmlFor="fileAttachment" className="form-label">Attach File (Optional)</label>
                                                    <input
                                                        type="file"
                                                        name="fileAttachment"
                                                        id="fileAttachment"
                                                        className="form-control"
                                                        onChange={handleChange}
                                                        ref={fileInputRef} 
                                                    />
                                                </div>
                                                <button type="submit" className="btn btn-primary mt-2">Send Reply</button>
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
    );
};

export default SupportTicketEdit;
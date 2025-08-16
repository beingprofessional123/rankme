import React, { useState, useContext } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { Link, useNavigate } from 'react-router-dom';
import { PermissionContext } from '../../UserPermission';
import axios from 'axios';
import Swal from 'sweetalert2';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:4000';

// Define the static categories and priorities here for reusability
const CATEGORY_OPTIONS = [
    'Technical Issue',
    'Feature Request',
    'Billing Inquiry',
    'General Question',
    'Bug Report',
    'Access Problem'
];

const PRIORITY_OPTIONS = [
    'Low',
    'Medium',
    'High',
    'Urgent'
];

const SupportTicketAddPage = () => {
    const navigate = useNavigate();
    const { permissions, role } = useContext(PermissionContext);
    const isCompanyAdmin = role?.name === 'company_admin';
    const canAccess = (action) => {
        if (isCompanyAdmin) return true;
        return permissions?.support_ticket?.[action] === true;
    };

    // State to hold form data and UI feedback
    const [formData, setFormData] = useState({
        subject: '',
        category: '',
        description: '',
        priority: 'Medium', // Default priority
        file: null,
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Handle input changes
    const handleChange = (e) => {
        const { name, value, files } = e.target;
        if (name === 'file') {
            setFormData(prev => ({ ...prev, file: files[0] }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        // Create FormData object to send multipart/form-data
        const data = new FormData();
        data.append('subject', formData.subject);
        data.append('category', formData.category);
        data.append('description', formData.description);
        data.append('priority', formData.priority);
        if (formData.file) {
            data.append('file', formData.file);
        }
        
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(`${API_BASE_URL}/api/support-ticket/create`, data, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data', // This is crucial for file uploads
                },
            });
            
            Swal.fire('Success!', response.data.message, 'success');
            navigate('/support-tickets'); // Redirect to the tickets list page
        } catch (err) {
            console.error('Failed to create ticket:', err);
            const errorMessage = err.response?.data?.message || 'An unexpected error occurred. Please try again.';
            Swal.fire('Error!', errorMessage, 'error');
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="mainbody">
                <div className="container-fluid">
                    {/* Breadcrumbs Section */}
                    <div className="row breadcrumbrow">
                        <div className="col-md-12">
                            <div className="breadcrumb-sec">
                                <h2>Support Ticket Add</h2>
                                <nav aria-label="breadcrumb">
                                    <ol className="breadcrumb">
                                        <li className="breadcrumb-item"><Link to="/support-tickets">Home</Link></li>
                                        <li className="breadcrumb-item active" aria-current="page">Support Ticket Add</li>
                                    </ol>
                                </nav>
                            </div>
                        </div>
                    </div>

                    <div className="white-bg">
                        <div className="form-design">
                            <form onSubmit={handleSubmit}>
                                <div className="row">
                                    {/* Subject */}
                                    <div className="col-md-6">
                                        <div className="form-group">
                                            <label className="form-label">Subject</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                placeholder="Subject"
                                                name="subject"
                                                value={formData.subject}
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>
                                    </div>

                                    {/* Category - Now a dropdown */}
                                    <div className="col-md-6">
                                        <div className="form-group">
                                            <label className="form-label">Category</label>
                                            <select
                                                name="category"
                                                className="form-select form-control"
                                                value={formData.category}
                                                onChange={handleChange}
                                                required
                                            >
                                                <option value="">Select Category</option>
                                                {CATEGORY_OPTIONS.map(cat => (
                                                    <option key={cat} value={cat}>{cat}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    
                                    {/* Priority - New dropdown field */}
                                    <div className="col-md-6">
                                        <div className="form-group">
                                            <label className="form-label">Priority</label>
                                            <select
                                                name="priority"
                                                className="form-select form-control"
                                                value={formData.priority}
                                                onChange={handleChange}
                                            >
                                                {PRIORITY_OPTIONS.map(prio => (
                                                    <option key={prio} value={prio}>{prio}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {/* File Upload */}
                                    <div className="col-md-6">
                                        <div className="form-group">
                                            <label className="form-label">File Upload</label>
                                            <div className="fileupload">
                                                <input
                                                    type="file"
                                                    className="form-control d-control"
                                                    id="file-1"
                                                    name="file"
                                                    onChange={handleChange}
                                                />
                                                <label className="fileupload-label" htmlFor="file-1">
                                                    <img
                                                        src={`/user/images/uploadfile.svg`}
                                                        className="img-fluid"
                                                        alt="upload icon"
                                                    />
                                                </label>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Description */}
                                    <div className="col-md-12">
                                        <div className="form-group">
                                            <label className="form-label">Description</label>
                                            <textarea
                                                className="form-control"
                                                rows={6}
                                                placeholder="Description"
                                                name="description"
                                                value={formData.description}
                                                onChange={handleChange}
                                                required
                                            ></textarea>
                                        </div>
                                    </div>
                                </div>

                                {/* Submit Button */}
                                <div className="addentry-btn">
                                    {canAccess('add') && (
                                        <button 
                                            type="submit" 
                                            className="btn btn-info"
                                            disabled={loading}
                                        >
                                            {loading ? 'Submitting...' : 'Submit'}
                                        </button>
                                    )}
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default SupportTicketAddPage;
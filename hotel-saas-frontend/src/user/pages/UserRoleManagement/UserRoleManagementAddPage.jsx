import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { Link, useNavigate } from 'react-router-dom'; // Import useNavigate
import axios from 'axios'; // Import axios
import { ToastContainer, toast } from 'react-toastify'; // Import toast notifications
import 'react-toastify/dist/ReactToastify.css'; // Import toast CSS

const UserRoleManagementAddPage = () => {
    const navigate = useNavigate(); // Hook for programmatic navigation
    const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

    // State for form inputs
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phone: '', // Phone is optional
        role_id: '',
        is_active: true, // Default to active
        // company_id: '' // Might be needed if super_admin can assign to different companies
    });

    // State for dropdown roles
    const [roles, setRoles] = useState([]);
    // State for validation errors
    const [formErrors, setFormErrors] = useState({});
    // State for loading indicators
    const [loading, setLoading] = useState(false);
    // State to prevent multiple submissions
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Helper function to get the auth token
    const getAuthToken = () => {
        return localStorage.getItem('token');
    };

    // --- Fetch Roles for Dropdown ---
    useEffect(() => {
        const fetchRoles = async () => {
            setLoading(true);
            try {
                const token = getAuthToken();
                if (!token) {
                    toast.error('Authentication token not found. Please log in.');
                    setLoading(false);
                    return;
                }
                const response = await axios.get(`${API_BASE_URL}/api/roles/list`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                setRoles(response.data.roles);
            } catch (error) {
                console.error('Error fetching roles:', error);
                const errorMessage = error.response?.data?.message || 'Failed to load roles for the dropdown.';
                toast.error(errorMessage);
            } finally {
                setLoading(false);
            }
        };

        fetchRoles();
    }, [API_BASE_URL]);

    // --- Input Change Handler ---
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        // Clear error for the field being changed
        if (formErrors[name]) {
            setFormErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    // --- Client-Side Validation ---
    const validateForm = () => {
        const errors = {};
        if (!formData.fullName.trim()) {
            errors.fullName = 'Full Name is required.';
        } else if (formData.fullName.trim().length < 2) {
            errors.fullName = 'Full Name must be at least 2 characters.';
        }
        if (!formData.email.trim()) {
            errors.email = 'Email Address is required.';
        } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
            errors.email = 'Please enter a valid email address.';
        }
        if (!formData.role_id) {
            errors.role_id = 'Role is required.';
        }
        // Optional: Phone number validation (e.g., regex for digits)
        if (formData.phone && !/^\d{10,15}$/.test(formData.phone)) { // Example: 10-15 digits
            errors.phone = 'Please enter a valid phone number (10-15 digits).';
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0; // Return true if no errors
    };

    // --- Form Submission Handler ---
    const handleSubmit = async (e) => {
        e.preventDefault(); // Prevent default form submission

        if (!validateForm()) {
            toast.error('Please correct the validation errors.');
            return;
        }

        setIsSubmitting(true);
        try {
            const token = getAuthToken();
            if (!token) {
                toast.error('Authentication token not found. Please log in.');
                setIsSubmitting(false);
                return;
            }

            const payload = {
                fullName: formData.fullName,
                email: formData.email,
                phone: formData.phone || null, // Send null if empty
                role_id: formData.role_id,
                is_active: formData.is_active,
                // If the backend expects company_id from frontend (e.g., for super_admin creating users)
                // company_id: formData.company_id || null,
            };

            const response = await axios.post(`${API_BASE_URL}/api/users/create`, payload, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            toast.success(response.data.message || 'User created successfully!');
            // Optionally clear form or redirect
            setFormData({
                fullName: '',
                email: '',
                phone: '',
                role_id: '',
                is_active: true,
            });
            navigate('/user-role-management'); // Redirect to user list page
        } catch (error) {
            console.error('Error creating user:', error);
            const serverErrors = error.response?.data?.errors; // For specific validation errors from backend
            const errorMessage = error.response?.data?.message || 'Failed to create user. Please try again.';

            if (serverErrors) {
                // If backend returns detailed validation errors
                const newErrors = {};
                if (Array.isArray(serverErrors)) { // If errors are in an array (e.g., from express-validator)
                    serverErrors.forEach(err => {
                        if (err.path) newErrors[err.path] = err.msg; // Map to form field name
                        else newErrors.general = err.msg; // General error
                    });
                } else if (typeof serverErrors === 'object') { // If errors are in an object (as returned by your controller for validation)
                    Object.keys(serverErrors).forEach(key => {
                        newErrors[key] = serverErrors[key];
                    });
                }
                setFormErrors(prev => ({ ...prev, ...newErrors }));
                toast.error('Please correct the highlighted errors.');
            } else {
                toast.error(errorMessage);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="mainbody">
                <div className="container-fluid">

                    <div className="row breadcrumbrow">
                        <div className="col-md-12">
                            <div className="breadcrumb-sec">
                                <h2>User Add</h2>
                                <nav aria-label="breadcrumb">
                                    <ol className="breadcrumb">
                                        <li className="breadcrumb-item"><Link to="/user-role-management">Home</Link></li>
                                        <li className="breadcrumb-item active" aria-current="page">User Add</li>
                                    </ol>
                                </nav>
                            </div>
                        </div>
                    </div>
                    <div className="white-bg">
                        <div className="form-design">
                            <form onSubmit={handleSubmit}>
                                <div className="row">
                                    <div className="col-md-6">
                                        <div className="form-group">
                                            <label className="form-label">Full Name <span className="text-danger">*</span></label>
                                            <input
                                                type="text"
                                                className={`form-control ${formErrors.fullName ? 'is-invalid' : ''}`}
                                                name="fullName"
                                                placeholder="Full Name"
                                                value={formData.fullName}
                                                onChange={handleChange}
                                            />
                                            {formErrors.fullName && <div className="invalid-feedback">{formErrors.fullName}</div>}
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="form-group">
                                            <label className="form-label">Email Address <span className="text-danger">*</span></label>
                                            <input
                                                type="text"
                                                className={`form-control ${formErrors.email ? 'is-invalid' : ''}`}
                                                name="email"
                                                placeholder="Email Address"
                                                value={formData.email}
                                                onChange={handleChange}
                                            />
                                            {formErrors.email && <div className="invalid-feedback">{formErrors.email}</div>}
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="form-group">
                                            <label className="form-label">Phone Number (Optional)</label>
                                            <input
                                                type="text"
                                                className={`form-control ${formErrors.phone ? 'is-invalid' : ''}`}
                                                name="phone"
                                                placeholder="Phone Number"
                                                value={formData.phone}
                                                onChange={handleChange}
                                            />
                                            {formErrors.phone && <div className="invalid-feedback">{formErrors.phone}</div>}
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="form-group">
                                            <label className="form-label">Select Role <span className="text-danger">*</span></label>
                                            <select
                                                className={`form-select form-control ${formErrors.role_id ? 'is-invalid' : ''}`}
                                                name="role_id"
                                                value={formData.role_id}
                                                onChange={handleChange}
                                            >
                                                <option value="">{loading ? 'Loading Roles...' : 'Select Role'}</option>
                                                {roles.map(role => (
                                                    <option key={role.id} value={role.id}>
                                                        {role.name.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase())}
                                                    </option>
                                                ))}
                                            </select>
                                            {formErrors.role_id && <div className="invalid-feedback">{formErrors.role_id}</div>}
                                        </div>
                                    </div>
                                    <div className="col-md-12">
                                        <div className="form-group form-check mt-3">
                                            <input
                                                type="checkbox"
                                                className="form-check-input"
                                                id="isActive"
                                                name="is_active"
                                                checked={formData.is_active}
                                                onChange={handleChange}
                                            />
                                            <label className="form-check-label" htmlFor="isActive">Is Active</label>
                                        </div>
                                    </div>
                                </div>

                                <div className="addentry-btn">
                                    <button
                                        type="submit"
                                        className="btn btn-info"
                                        disabled={isSubmitting} // Disable button while submitting
                                    >
                                        {isSubmitting ? 'Submitting...' : 'Submit'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default UserRoleManagementAddPage;
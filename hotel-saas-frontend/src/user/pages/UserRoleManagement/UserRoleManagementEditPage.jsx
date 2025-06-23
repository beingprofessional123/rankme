import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'; // Import useNavigate and useParams
import axios from 'axios'; // Import axios
import { ToastContainer, toast } from 'react-toastify'; // Import toast notifications
import 'react-toastify/dist/ReactToastify.css'; // Import toast CSS

const UserRoleManagementEditPage = () => {
    const navigate = useNavigate();
    const { id } = useParams(); // Get user ID from URL parameters
    const location = useLocation(); // Used for initial data if available, but API call is primary
    const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

    // State for form inputs
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phone: '',
        role_id: '',
        is_active: false, // Default status
    });

    // State for dropdown roles
    const [roles, setRoles] = useState([]);
    // State for validation errors
    const [formErrors, setFormErrors] = useState({});
    // State for loading indicators
    const [loadingUser, setLoadingUser] = useState(true); // Loading state for fetching user data
    const [loadingRoles, setLoadingRoles] = useState(true); // Loading state for fetching roles
    const [isSubmitting, setIsSubmitting] = useState(false); // State to prevent multiple submissions
    const [pageError, setPageError] = useState(null); // General error for page load

    // Helper function to get the auth token
    const getAuthToken = () => {
        return localStorage.getItem('token');
    };

    // --- Fetch User Data and Roles on Component Mount ---
    useEffect(() => {
        const fetchData = async () => {
            const token = getAuthToken();
            if (!token) {
                setPageError('Authentication token not found. Please log in.');
                toast.error('You are not authenticated. Please log in.');
                setLoadingUser(false);
                setLoadingRoles(false);
                // Optionally redirect to login page
                // navigate('/login');
                return;
            }

            // Fetch User Data
            try {
                const userResponse = await axios.get(`${API_BASE_URL}/api/users/${id}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const userData = userResponse.data.user;
                setFormData({
                    fullName: userData.name || '',
                    email: userData.email || '',
                    phone: userData.phone || '',
                    role_id: userData.role_id || '', // Use role_id
                    is_active: userData.is_active || false,
                });
                toast.success(userResponse.data.message || 'User data loaded successfully!');
            } catch (error) {
                console.error('Error fetching user data:', error);
                const errorMessage = error.response?.data?.message || 'Failed to load user data.';
                setPageError(errorMessage);
                toast.error(errorMessage);
            } finally {
                setLoadingUser(false);
            }

            // Fetch Roles for Dropdown
            try {
                const rolesResponse = await axios.get(`${API_BASE_URL}/api/roles/list`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setRoles(rolesResponse.data.roles);
            } catch (error) {
                console.error('Error fetching roles:', error);
                const errorMessage = error.response?.data?.message || 'Failed to load roles for the dropdown.';
                toast.error(errorMessage);
            } finally {
                setLoadingRoles(false);
            }
        };

        if (id) {
            fetchData();
        } else {
            setPageError('No user ID provided.');
            setLoadingUser(false);
            setLoadingRoles(false);
        }
    }, [id, API_BASE_URL]); // Rerun if ID or API_BASE_URL changes

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
        e.preventDefault();

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
            };

            const response = await axios.put(`${API_BASE_URL}/api/users/${id}`, payload, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            toast.success(response.data.message || 'User updated successfully!');
            navigate('/user-role-management'); // Redirect to user list page
        } catch (error) {
            console.error('Error updating user:', error);
            const serverErrors = error.response?.data?.errors;
            const errorMessage = error.response?.data?.message || 'Failed to update user. Please try again.';

            if (serverErrors) {
                const newErrors = {};
                if (Array.isArray(serverErrors)) {
                    serverErrors.forEach(err => {
                        if (err.path) newErrors[err.path] = err.msg;
                        else newErrors.general = err.msg;
                    });
                } else if (typeof serverErrors === 'object') {
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

    // Show loading or error message while data is being fetched
    if (loadingUser || loadingRoles) {
        return (
            <DashboardLayout>
                <ToastContainer />
                <div className="mainbody">
                    <div className="container-fluid">
                        <p>Loading user data and roles...</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    if (pageError) {
        return (
            <DashboardLayout>
                <ToastContainer />
                <div className="mainbody">
                    <div className="container-fluid">
                        <p style={{ color: 'red' }}>Error: {pageError}</p>
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
                                <h2>User Edit</h2>
                                <nav aria-label="breadcrumb">
                                    <ol className="breadcrumb">
                                        <li className="breadcrumb-item">
                                            <Link to="/user-role-management">Home</Link>
                                        </li>
                                        <li className="breadcrumb-item active" aria-current="page">
                                            User Edit
                                        </li>
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
                                                value={formData.fullName}
                                                onChange={handleChange}
                                                placeholder="Full Name"
                                            />
                                            {formErrors.fullName && <div className="invalid-feedback">{formErrors.fullName}</div>}
                                        </div>
                                    </div>

                                    <div className="col-md-6">
                                        <div className="form-group">
                                            <label className="form-label">Email Address <span className="text-danger">*</span></label>
                                            <input
                                                type="email"
                                                className={`form-control ${formErrors.email ? 'is-invalid' : ''}`}
                                                name="email"
                                                value={formData.email}
                                                onChange={handleChange}
                                                placeholder="Email Address"
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
                                                value={formData.phone}
                                                onChange={handleChange}
                                                placeholder="Phone Number"
                                            />
                                            {formErrors.phone && <div className="invalid-feedback">{formErrors.phone}</div>}
                                        </div>
                                    </div>

                                    <div className="col-md-6">
                                        <div className="form-group">
                                            <label className="form-label">Select Role <span className="text-danger">*</span></label>
                                            <select
                                                name="role_id" // Use role_id as name
                                                className={`form-select form-control ${formErrors.role_id ? 'is-invalid' : ''}`}
                                                value={formData.role_id}
                                                onChange={handleChange}
                                            >
                                                <option value="">Select Role</option>
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
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? 'Updating...' : 'Update'}
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

export default UserRoleManagementEditPage;
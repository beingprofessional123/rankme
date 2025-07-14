import React, { useState, useEffect, useContext } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { PermissionContext } from '../../UserPermission';

const staticModules = [
    {
        key: 'pricing_calendar',
        value: 'Pricing Calendar',
        permissions: [
            { key: 'tab', label: 'Tab Show/hide' }
        ]
    },
    {
        key: 'forecasts',
        value: 'Forecast',
        permissions: [
            { key: 'tab', label: 'Tab Show/hide' }
        ]
    },
    {
        key: 'reports',
        value: 'Reports',
        permissions: [
            { key: 'tab', label: 'Tab Show/hide' },
        ]
    },
    {
        key: 'hotels_rooms',
        value: 'Hotels & Rooms',
        permissions: [
            { key: 'tab', label: 'Tab Show/hide' },
            { key: 'add', label: 'Add' },
            { key: 'edit', label: 'Edit' },
            { key: 'delete', label: 'Delete' },
            { key: 'view', label: 'View' },
            { key: 'connect', label: 'Connect' },
        ]
    },
    {
        key: 'upload_data',
        value: 'Upload Data',
        permissions: [
            { key: 'tab', label: 'Tab Show/hide' },
        ]
    },
    {
        key: 'competitor_rates',
        value: 'Competitor Rates',
        permissions: [
            { key: 'tab', label: 'Tab Show/hide' },
            { key: 'add', label: 'Add' },
            { key: 'edit', label: 'Edit' },
            { key: 'delete', label: 'Delete' },
        ]
    },
    {
        key: 'user_role_management',
        value: 'User Role Management',
        permissions: [
            { key: 'tab', label: 'Tab Show/hide' },
            { key: 'add', label: 'Add' },
            { key: 'edit', label: 'Edit' },
            { key: 'delete', label: 'Delete' },
        ]
    },
    {
        key: 'support_ticket',
        value: 'Support Ticket',
        permissions: [
            { key: 'tab', label: 'Tab Show/hide' },
            { key: 'add', label: 'Add' },
            { key: 'edit', label: 'Edit' },
            { key: 'delete', label: 'Delete' },
            { key: 'view', label: 'View' },
        ]
    }
];

const UserRoleManagementAddPage = () => {
    const { permissions, role } = useContext(PermissionContext);
    const isCompanyAdmin = role?.name === 'company_admin';
    const canAccess = (action) => {
        if (isCompanyAdmin) return true;
        return permissions?.user_role_management?.[action] === true;
    };
    const [countryList, setCountryList] = useState(['']);
    const navigate = useNavigate();
    const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phone: '',
        role_id: '',
        is_active: true,
        countryCodeid: '',
    });

    const [roles, setRoles] = useState([]);
    const [formErrors, setFormErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [tabPermissions, setTabPermissions] = useState([]);

    const getAuthToken = () => {
        return localStorage.getItem('token');
    };

    useEffect(() => {
        const fetchRoles = async () => {
            setLoading(true);
            try {
                const token = getAuthToken();
                if (!token) {
                    toast.error('Authentication token not found. Please log in.');
                    return;
                }
                const response = await axios.get(`${API_BASE_URL}/api/roles/list`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                setRoles(response.data.roles);
            } catch (error) {
                const errorMessage = error.response?.data?.message || 'Failed to load roles for the dropdown.';
                toast.error(errorMessage);
            } finally {
                setLoading(false);
            }
        };

        const fetchCountryList = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/api/country-list`);
                const data = await response.json();
                if (data.status === 'success') {
                    setCountryList(data.results);
                }
            } catch (err) {
                console.error('Failed to fetch countries:', err);
            }
        };


        const initialPermissions = staticModules.map((mod, i) => {
            const permissions = {};
            mod.permissions.forEach(p => {
                permissions[p.key] = false;
            });
            return {
                module_id: i + 1,
                module_key: mod.key,
                module_name: mod.value,
                permissions
            };
        });

        setTabPermissions(initialPermissions);



        fetchRoles();
        fetchCountryList();
    }, [API_BASE_URL]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
        if (formErrors[name]) setFormErrors(prev => ({ ...prev, [name]: '' }));
    };

    const togglePermission = (index, key) => {
        setTabPermissions(prev => {
            const updated = [...prev];
            updated[index].permissions[key] = !updated[index].permissions[key];
            return updated;
        });
    };

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

        if (formData.phone) {
            const digitsOnly = formData.phone.replace(/\D/g, '');
            if (!/^[0-9\s\-()]+$/.test(formData.phone)) {
                errors.phone = 'Phone number must contain only numbers, spaces, dashes, or brackets.';
            } else if (digitsOnly.length < 8 || digitsOnly.length > 15) {
                errors.phone = 'Phone number must be between 8 and 15 digits long.';
            }
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

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
                phone: formData.phone || null,
                role_id: formData.role_id,
                is_active: formData.is_active,
                countryCodeid: formData.countryCodeid?.trim() || null,
                permissions: tabPermissions,
            };

            const response = await axios.post(`${API_BASE_URL}/api/users/create`, payload, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            toast.success(response.data.message || 'User created successfully!');
            setFormData({
                fullName: '',
                email: '',
                phone: '',
                role_id: '',
                is_active: true,
                countryCodeid: '',
            });
            navigate('/user-role-management');
        } catch (error) {
            console.error('Error creating user:', error);
            const serverErrors = error.response?.data?.errors;
            const errorMessage = error.response?.data?.message || 'Failed to create user. Please try again.';

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
                                        <div className="row">
                                            <div className="col-3">
                                                <div className="form-group">
                                                    <label className="form-label">Code</label>
                                                    <select
                                                        name="countryCodeid"
                                                        value={formData.countryCodeid}
                                                        onChange={handleChange}
                                                        className="form-control"
                                                    >
                                                        <option value="">Select Country</option>
                                                        {countryList.map((country) => (
                                                            <option key={country.id || country.phonecode} value={country.id}>
                                                                 {country.phonecode} ({country.short_name})
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="col-9">
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
                                                    {formErrors.phone && (
                                                        <div className="invalid-feedback">{formErrors.phone}</div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="col-md-6">
                                        <div className="form-group">
                                            <label className="form-label">Select Role <span className="text-danger">*</span></label>
                                            <select
                                                className={`form-control ${formErrors.role_id ? 'is-invalid' : ''}`}
                                                name="role_id"
                                                value={formData.role_id}
                                                onChange={handleChange}
                                            >
                                                <option value="">{loading ? 'Loading Roles...' : 'Select Role'}</option>
                                                {roles.map(role => (
                                                    <option key={role.id} value={role.id}>
                                                        {role.name
                                                            .replace(/_/g, ' ')
                                                            .replace(/\b\w/g, char => char.toUpperCase())}
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
                                {/* Module Permissions */}
                                {formData.role_id && (
                                    <div className="mt-3">
                                        <div className="col-md-12 border rounded p-3 mb-3 text-center">
                                            <strong>Module Permissions</strong>
                                        </div>

                                        {tabPermissions.map((module, index) => {
                                            const moduleDef = staticModules.find(m => m.key === module.module_key);
                                            return (
                                                <div key={module.module_key} className="border rounded p-3 mb-3">
                                                    <div className="row">
                                                        <div className="col-md-2">
                                                            <strong>{module.module_name}</strong>
                                                        </div>
                                                        <div className="col-md-10">
                                                            {moduleDef?.permissions.map(({ key, label }) => (
                                                                <div className='dflexpermession' key={key}>
                                                                    <div className="form-check">
                                                                        <input
                                                                            className="form-check-input"
                                                                            type="checkbox"
                                                                            id={`${module.module_key}-${key}`}
                                                                            checked={module.permissions[key]}
                                                                            onChange={() => togglePermission(index, key)}
                                                                        />
                                                                        <label className="form-check-label ms-2" htmlFor={`${module.module_key}-${key}`}>
                                                                            {label}
                                                                        </label>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}


                                <div className="addentry-btn mt-4">
                                    {canAccess('add') && (
                                    <button
                                        type="submit"
                                        className="btn btn-info"
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? 'Submitting...' : 'Submit'}
                                    </button>
                                    )}
                                </div>
                            </form>
                            <ToastContainer />
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default UserRoleManagementAddPage;

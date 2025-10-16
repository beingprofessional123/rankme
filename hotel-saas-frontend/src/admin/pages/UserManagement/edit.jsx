import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

const MAX_NAME_LENGTH = 40;
const MAX_EMAIL_LENGTH = 60;
const MAX_PHONE_LENGTH = 15;
const MAX_COMPANY_NAME_LENGTH = 40;
const MAX_IMAGE_SIZE_MB = 2; // 2 MB

const UserManagementEdit = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [countryList, setCountryList] = useState([]);
    const [userRolelist, setUserRoleList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState({
        name: '',
        email: '',
        phone: '',
        countryCodeid: '',
        company_name: '',
        company_id: '',
        profile: null,
        role_id: '',
        status: '1', // 1 = Active, 2 = Inactive
    });
    const [initialForm, setInitialForm] = useState(null);
    const [previewImage, setPreviewImage] = useState('');
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchUser();
        fetchCountryList();
        fetchUserRolelist();
    }, []);

    useEffect(() => {
        if (window.jQuery && window.jQuery.fn.dropify) {
            window.jQuery('.dropify').dropify({
            messages: {
                default: 'Click or Drag and Drop to Upload',
                replace: 'Click or Drag and Drop to Replace',
                remove: 'Remove',
                error: 'Oops, Something Went Wrong',
            }
            });
        }
    });

    useEffect(() => {
        if (window.jQuery && window.jQuery.fn.dropify) {
            const drEvent = window.jQuery('.dropify').dropify();
            drEvent.on('dropify.afterClear', () => {
            setForm((prev) => ({ ...prev, profile: null }));
            setPreviewImage('');
            });
        }
    }, [previewImage]);

    const fetchUser = async () => {
        try {
            const token = localStorage.getItem('admin_token');
            const { data } = await axios.get(
                `${process.env.REACT_APP_API_BASE_URL}/api/admin/user-management/${id}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            const user = data.results;
            const initialData = {
                name: user.name || '',
                email: user.email || '',
                phone: user.phone || '',
                countryCodeid: user.countryCodeid || '',
                company_name: user.Company?.name || '',
                company_id: user.company_id || '',
                profile: null,
                role_id: user.role_id || '',
                status: user.is_active ? '1' : '2',
            };
            setForm(initialData);
            setInitialForm(initialData);
            setPreviewImage(user.profile || '');
            setLoading(false);
        } catch (err) {
            console.error('Error fetching user:', err);
            toast.error('Failed to load user data.');
            setLoading(false);
        }
    };

    const fetchCountryList = async () => {
        try {
            const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/country-list`);
            const data = await response.json();
            if (data.status === 'success') {
                setCountryList(data.results);
            }
        } catch (err) {
            console.error('Failed to fetch countries:', err);
        }
    };

    const fetchUserRolelist = async () => {
        try {
            const token = localStorage.getItem('admin_token');
            const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/admin/roles-list`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await response.json();
            if (data.status === 'success') {
                setUserRoleList(data.results);
            }
        } catch (err) {
            console.error('Failed to fetch roles:', err);
        }
    };

    const validateField = (name, value) => {
        let error = '';
        switch (name) {
            case 'name':
                if (value.trim() === '') {
                    error = 'Name is required.';
                } else if (value.length > MAX_NAME_LENGTH) {
                    error = `Name must be less than ${MAX_NAME_LENGTH} characters.`;
                }
                break;
            case 'company_name':
                if (value.length > MAX_COMPANY_NAME_LENGTH) {
                    error = `Company name must be less than ${MAX_COMPANY_NAME_LENGTH} characters.`;
                }
                break;
            case 'email':
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (value.trim() === '') {
                    error = 'Email is required.';
                } else if (!emailRegex.test(value)) {
                    error = 'Please enter a valid email address.';
                } else if (value.length > MAX_EMAIL_LENGTH) {
                    error = `Email must be less than ${MAX_EMAIL_LENGTH} characters.`;
                }
                break;
            case 'phone':
                const phoneRegex = /^[0-9]+$/;
                if (value.trim() !== '' && !phoneRegex.test(value)) {
                    error = 'Phone number can only contain digits.';
                } else if (value.length > MAX_PHONE_LENGTH) {
                    error = `Phone number must be less than ${MAX_PHONE_LENGTH} digits.`;
                }
                break;
            case 'role_id':
                if (value === '') {
                    error = 'Role is required.';
                }
                break;
            default:
                break;
        }
        setErrors((prev) => ({ ...prev, [name]: error }));
        return error === '';
    };

    const handleChange = (e) => {
        const { name, value, type, files } = e.target;
        if (type === 'file') {
            const file = files[0];
            if (file) {
                const isValid = validateFile(file);
                if (isValid) {
                    setForm((prev) => ({ ...prev, [name]: file }));
                    setPreviewImage(URL.createObjectURL(file));
                    setErrors((prev) => ({ ...prev, profile: '' }));
                } else {
                    setForm((prev) => ({ ...prev, [name]: null }));
                    setPreviewImage('');
                }
            }
        } else {
            setForm((prev) => {
                const newForm = { ...prev, [name]: value };
                validateField(name, newForm[name]);
                return newForm;
            });
        }
    };

    const validateFile = (file) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/jpg'];
        const maxSize = MAX_IMAGE_SIZE_MB * 1024 * 1024;

        if (!allowedTypes.includes(file.type)) {
            toast.error('Only JPG, JPEG, PNG, and GIF images are allowed.');
            setErrors((prev) => ({ ...prev, profile: 'Invalid file type.' }));
            return false;
        }

        if (file.size > maxSize) {
            toast.error(`Image size must be less than ${MAX_IMAGE_SIZE_MB}MB.`);
            setErrors((prev) => ({ ...prev, profile: 'File size too large.' }));
            return false;
        }
        return true;
    };

    const validateForm = async () => {
        const fieldErrors = {};
        let isValid = true;

        if (!validateField('name', form.name)) isValid = false;
        if (!validateField('email', form.email)) isValid = false;
        if (!validateField('phone', form.phone)) isValid = false;
        if (!validateField('role_id', form.role_id)) isValid = false;

        // Check if email already exists, but only if it's different from the original email.
        if (form.email !== initialForm.email) {
            try {
                const token = localStorage.getItem('admin_token');
                const response = await axios.post(
                    `${process.env.REACT_APP_API_BASE_URL}/api/admin/check-email`,
                    { email: form.email },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                if (response.data.exists) {
                    fieldErrors.email = 'This email is already in use.';
                    isValid = false;
                }
            } catch (err) {
                console.error('Email check failed:', err);
                // Continue with form submission if API check fails
            }
        }

        setErrors((prev) => ({ ...prev, ...fieldErrors }));
        return isValid;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSubmitting) return;

        setIsSubmitting(true);
        const isValid = await validateForm();

        if (!isValid) {
            setIsSubmitting(false);
            toast.error('Please correct the validation errors.');
            return;
        }

        const token = localStorage.getItem('admin_token');
        const formData = new FormData();

        for (let key in form) {
            if (form[key] !== null) {
                formData.append(key, form[key]);
            }
        }
        formData.append('is_active', form.status === '1');

        try {
            const response = await axios.put(
                `${process.env.REACT_APP_API_BASE_URL}/api/admin/user-management/${id}`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (response.data.status_code === 200) {
                toast.success(response.data.message || 'User updated successfully');
                navigate('/admin/user-management');
            } else {
                toast.error(response.data.message || 'Update failed');
            }
        } catch (err) {
            console.error('Error updating user:', err);
            toast.error(err?.response?.data?.message || 'An unexpected error occurred');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReset = () => {
        if (initialForm) {
            setForm(initialForm);
            setErrors({});
            // Reset profile picture preview to the original one
            fetchUser();
        }
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{height: "70vh"}}>
            <h4>Loading user data...</h4>
            </div>
        );
    }
    return (
        <div>
            <div className="layout-px-spacing">
                <div className="page-header d-flex justify-content-between">
                    <div className="page-title">
                        <h3>Edit</h3>
                    </div>
                    <div className="page-title page-btn">
                        <Link className="btn btn-primary" to="/admin/user-management">Back</Link>
                    </div>
                </div>
                <div className="account-settings-container layout-top-spacing">
                    <div className="layout-spacing">
                        <div className="general-info section general-infomain">
                            <form onSubmit={handleSubmit} encType="multipart/form-data">
                                <div className="account-content mt-2 mb-2">
                                    <div className="row">
                                        <div className="col-xl-12 col-lg-12 col-md-12 layout-spacing">
                                            <div className="section general-info">
                                                <div className="info">
                                                    <div className="user-management-title">
                                                        <h4>User Details</h4>
                                                    </div>
                                                    <div className="row">
                                                        <div className="col-lg-12">
                                                            <div className="row">
                                                                <div className="col-xl-2 col-lg-12 col-md-4">
                                                                    <div className="upload pr-md-4">
                                                                        {previewImage ? (
                                                                            <input
                                                                                type="file"
                                                                                name="profile"
                                                                                className="dropify"
                                                                                data-default-file={previewImage}   // ✅ Show saved picture
                                                                                onChange={handleChange}
                                                                                accept="image/jpeg,image/png,image/gif,image/jpg"
                                                                            />
                                                                        ) : (
                                                                            <input
                                                                                type="file"
                                                                                name="profile"
                                                                                className="dropify"
                                                                                onChange={handleChange}
                                                                                accept="image/jpeg,image/png,image/gif,image/jpg"
                                                                            />
                                                                        )}
                                                                        <p className="mt-2">
                                                                            <i className="flaticon-cloud-upload mr-1"></i>Upload Picture
                                                                        </p>
                                                                        {errors.profile && <div className="text-danger">{errors.profile}</div>}
                                                                    </div>
                                                                </div>
                                                                <div className="col-xl-10 col-lg-12 col-md-8 mt-md-0 mt-4">
                                                                    <div className="form">
                                                                        <div className="row">
                                                                            <div className="col-sm-6">
                                                                                <div className="form-group">
                                                                                    <label>Company name</label>
                                                                                    <input type='hidden' name='company_id' value={form.company_id} />
                                                                                    <input
                                                                                        type="text"
                                                                                        name="company_name"
                                                                                        className="form-control"
                                                                                        value={form.company_name}
                                                                                        onChange={handleChange}
                                                                                        maxLength={MAX_COMPANY_NAME_LENGTH}
                                                                                    />
                                                                                    {errors.company_name && <div className="text-danger">{errors.company_name}</div>}
                                                                                </div>
                                                                            </div>
                                                                            <div className="col-sm-6">
                                                                                <div className="form-group">
                                                                                    <label>Name</label>
                                                                                    <input
                                                                                        type="text"
                                                                                        name="name"
                                                                                        className="form-control"
                                                                                        value={form.name}
                                                                                        onChange={handleChange}
                                                                                        maxLength={MAX_NAME_LENGTH}
                                                                                        required
                                                                                    />
                                                                                    {errors.name && <div className="text-danger">{errors.name}</div>}
                                                                                </div>
                                                                            </div>
                                                                            <div className="col-sm-6">
                                                                                <div className="form-group">
                                                                                    <label>Email</label>
                                                                                    <input
                                                                                        type="email"
                                                                                        name="email"
                                                                                        className="form-control"
                                                                                        value={form.email}
                                                                                        onChange={handleChange}
                                                                                        maxLength={MAX_EMAIL_LENGTH}
                                                                                        required
                                                                                    />
                                                                                    {errors.email && <div className="text-danger">{errors.email}</div>}
                                                                                </div>
                                                                            </div>
                                                                            <div className="col-sm-2">
                                                                                <div className="form-group">
                                                                                    <label>Country</label>
                                                                                    <select
                                                                                        name="countryCodeid"
                                                                                        className="form-control"
                                                                                        value={form.countryCodeid}
                                                                                        onChange={handleChange}
                                                                                    >
                                                                                        <option value="">Select Country</option>
                                                                                        {countryList.map((country) => (
                                                                                            <option key={country.id} value={country.id}>
                                                                                                {country.name}
                                                                                            </option>
                                                                                        ))}
                                                                                    </select>
                                                                                    {errors.countryCodeid && <div className="text-danger">{errors.countryCodeid}</div>}
                                                                                </div>
                                                                            </div>
                                                                            <div className="col-sm-4">
                                                                                <div className="form-group">
                                                                                    <label>Phone</label>
                                                                                    <div className="input-group">
                                                                                        <div className="input-group-prepend">
                                                                                            <span className="input-group-text">
                                                                                                {countryList.find(c => c.id === form.countryCodeid)?.phonecode || '+'}
                                                                                            </span>
                                                                                        </div>
                                                                                        <input
                                                                                            type="text"
                                                                                            name="phone"
                                                                                            className="form-control"
                                                                                            value={form.phone}
                                                                                            onChange={handleChange}
                                                                                            placeholder="Enter phone number"
                                                                                            maxLength={MAX_PHONE_LENGTH}
                                                                                        />
                                                                                    </div>
                                                                                    {errors.phone && <div className="text-danger">{errors.phone}</div>}
                                                                                </div>
                                                                            </div>
                                                                            <div className="col-sm-6">
                                                                                <div className="form-group">
                                                                                    <label>Role</label>
                                                                                    <select
                                                                                        name="role_id"
                                                                                        className="form-control"
                                                                                        value={form.role_id || ''}
                                                                                        onChange={handleChange}
                                                                                        required
                                                                                    >
                                                                                        <option value="">Select Role</option>
                                                                                        {userRolelist.map((role) => (
                                                                                            <option key={role.id} value={role.id}>
                                                                                                {role.name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                                                                                            </option>
                                                                                        ))}
                                                                                    </select>
                                                                                    {errors.role_id && <div className="text-danger">{errors.role_id}</div>}
                                                                                </div>
                                                                            </div>
                                                                            <div className="col-sm-6">
                                                                                <div className="form-group">
                                                                                    <label>Status</label>
                                                                                    <select
                                                                                        name="status"
                                                                                        className="form-control"
                                                                                        value={form.status}
                                                                                        onChange={handleChange}
                                                                                    >
                                                                                        <option value="1">Active</option>
                                                                                        <option value="2">Inactive</option>
                                                                                    </select>
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
                                        </div>
                                    </div>
                                </div>
                                <div className="account-settings-footer">
                                    <div className="as-footer-container">
                                        <button type="button" className="btn btn-warning" onClick={handleReset}>Reset All</button>
                                        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                                            {isSubmitting ? 'Updating...' : 'Update'}
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserManagementEdit;
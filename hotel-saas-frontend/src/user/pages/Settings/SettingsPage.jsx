import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify'; // For notifications
import 'react-toastify/dist/ReactToastify.css'; // Toastify CSS
import Input from '../../components/forms/Input';

const SettingsPage = () => {
    const [activeTab, setActiveTab] = useState('general'); // 'general' or 'password'
    const [countryList, setCountryList] = useState([]);
    const [generalSettings, setGeneralSettings] = useState({
        profileImage: null, // For displaying current image
        companyName: '',
        fullName: '',
        emailAddress: '',
        phoneNumber: '',
        companyLogoUrl: null, // For displaying current logo
        countryCodeid: '',
        roleName: '',
    });
    const [generalSettingsFiles, setGeneralSettingsFiles] = useState({
        profileImageFile: null, // For new file uploads
        companyLogoUrlFile: null, // For new file uploads
    });
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({}); // To store validation errors from API

    // Base URL for your API (adjust if different in production)
    const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

    // Helper to get JWT token from localStorage (adjust based on where you store it)
    const getToken = () => localStorage.getItem('token');

    useEffect(() => {
        fetchCountryList();
        document.body.classList.add('loginbg');
        return () => {
            document.body.classList.remove('loginbg');
        };
    }, []);

    // --- General Settings: Fetch Data ---
    useEffect(() => {
        const fetchGeneralSettings = async () => {
            setLoading(true);
            setErrors({});
            try {
                const token = getToken();
                if (!token) {
                    toast.error('Authentication token not found. Please log in.');
                    setLoading(false);
                    return;
                }

                const response = await axios.get(`${API_BASE_URL}/api/settings/general-settings`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                const data = response.data.data;
                setGeneralSettings({
                    profileImage: data.profileImage,
                    companyName: data.companyName || '',
                    fullName: data.fullName || '',
                    emailAddress: data.emailAddress || '',
                    phoneNumber: data.phoneNumber || '',
                    companyLogoUrl: data.companyLogoUrl,
                    countryCodeid: data.countryCodeid || '',
                    roleName: data.roleName || '',
                });
                toast.success('General settings loaded successfully!');
            } catch (error) {
                console.error('Error fetching general settings:', error);
                toast.error(error.response?.data?.message || 'Failed to fetch general settings.');
            } finally {
                setLoading(false);
            }
        };

        if (activeTab === 'general') {
            fetchGeneralSettings();
        }
    }, [activeTab]);

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

    // --- General Settings: Handle Form Changes ---
    const handleGeneralSettingsChange = (e) => {
        const { name, value } = e.target;
        setGeneralSettings(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    const handleGeneralSettingsFileChange = (e) => {
        const { name, files } = e.target;
        if (files && files[0]) {
            setGeneralSettingsFiles(prev => ({ ...prev, [`${name}File`]: files[0] }));

            const reader = new FileReader();
            reader.onload = (event) => {
                setGeneralSettings(prev => ({ ...prev, [name]: event.target.result }));
            };
            reader.readAsDataURL(files[0]);
        }
        if (errors[name]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    // --- General Settings: Handle Form Submission ---
    const handleGeneralSettingsSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});

        try {
            const token = getToken();
            if (!token) {
                toast.error('Authentication token not found. Please log in.');
                setLoading(false);
                return;
            }

            const formData = new FormData();
            formData.append('fullName', generalSettings.fullName);
            formData.append('emailAddress', generalSettings.emailAddress);
            formData.append('phoneNumber', generalSettings.phoneNumber);
            formData.append('companyName', generalSettings.companyName);
            formData.append('countryCodeid', generalSettings.countryCodeid);

            if (generalSettingsFiles.profileImageFile) {
                formData.append('profileImage', generalSettingsFiles.profileImageFile);
            }
            if (generalSettingsFiles.companyLogoUrlFile) {
                formData.append('companyLogoUrl', generalSettingsFiles.companyLogoUrlFile);
            }

            const response = await axios.post(`${API_BASE_URL}/api/settings/general-settings/update`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${token}`,
                },
            });

            const updatedData = response.data.data;
            setGeneralSettings({
                profileImage: updatedData.profileImage,
                companyName: updatedData.companyName || '',
                fullName: updatedData.fullName || '',
                emailAddress: updatedData.emailAddress || '',
                phoneNumber: updatedData.phoneNumber || '',
                companyLogoUrl: updatedData.companyLogoUrl,
                countryCodeid: updatedData.countryCodeid || '',
                roleName: updatedData.roleName || '',
            });
            setGeneralSettingsFiles({
                profileImageFile: null,
                companyLogoUrlFile: null
            });
            // Update localStorage user object
            const user = JSON.parse(localStorage.getItem('user'));

            if (user) {
                if (user.role === 'company_admin') {
                    user.company.logo_url = updatedData.companyLogoUrl;
                }else{
                    user.profile_image = updatedData.profileImage;
                }


                localStorage.setItem('user', JSON.stringify(user));
            }
            toast.success(response.data.message || 'General settings updated successfully!');
        } catch (error) {
            console.error('Error updating general settings:', error);
            const apiErrors = {};
            if (error.response?.data?.message) {
                toast.error(error.response.data.message);
                if (error.response.status === 400) {
                    if (error.response.data.message.includes('Full name is required')) {
                        apiErrors.fullName = error.response.data.message;
                    } else if (error.response.data.message.includes('Email address is required') || error.response.data.message.includes('valid email address')) {
                        apiErrors.emailAddress = error.response.data.message;
                    } else if (error.response.data.message.includes('Company name is required')) {
                        apiErrors.companyName = error.response.data.message;
                    }
                }
            } else {
                toast.error('Failed to update general settings.');
            }
            setErrors(apiErrors);
        } finally {
            setLoading(false);
        }
    };

    // --- Change Password: Handle Form Changes ---
    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswordForm(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    // --- Change Password: Handle Form Submission ---
    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});

        try {
            const token = getToken();
            if (!token) {
                toast.error('Authentication token not found. Please log in.');
                setLoading(false);
                return;
            }

            const response = await axios.post(`${API_BASE_URL}/api/settings/change-password`, passwordForm, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            toast.success(response.data.message || 'Password updated successfully!');
            setPasswordForm({
                currentPassword: '',
                newPassword: '',
                confirmPassword: '',
            });

        } catch (error) {
            console.error('Error updating password:', error);
            const apiErrors = {};
            if (error.response?.data?.message) {
                toast.error(error.response.data.message);
                if (error.response.status === 400 || error.response.status === 401) {
                    if (error.response.data.message.includes('Current password is required') || error.response.data.message.includes('Invalid current password')) {
                        apiErrors.currentPassword = error.response.data.message;
                    } else if (error.response.data.message.includes('New password is required') || error.response.data.message.includes('New password must be')) {
                        apiErrors.newPassword = error.response.data.message;
                    } else if (error.response.data.message.includes('Confirm password is required') || error.response.data.message.includes('New password and confirm password do not match')) {
                        apiErrors.confirmPassword = error.response.data.message;
                    }
                }
            } else {
                toast.error('Failed to update password.');
            }
            setErrors(apiErrors);
        } finally {
            setLoading(false);
        }
    };

    return (
        <DashboardLayout>
            <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
            <div className="mainbody">
                <div className="container-fluid">
                    <div className="row breadcrumbrow">
                        <div className="col-md-12">
                            <div className="breadcrumb-sec">
                                <h2>Settings</h2>
                                <nav aria-label="breadcrumb">
                                    <ol className="breadcrumb">
                                        <li className="breadcrumb-item"><a href="#">Home</a></li>
                                        <li className="breadcrumb-item active" aria-current="page">Settings</li>
                                    </ol>
                                </nav>
                            </div>
                        </div>
                    </div>
                    <div className="white-bg">
                        <div className="report-tabdesign">
                            <ul className="nav nav-tabs" role="tablist">
                                <li className="nav-item">
                                    <a
                                        className={`nav-link ${activeTab === 'general' ? 'active' : ''}`}
                                        onClick={() => setActiveTab('general')}
                                        data-bs-toggle="tab"
                                        href="#home1"
                                    >
                                        General Settings
                                    </a>
                                </li>
                                <li className="nav-item">
                                    <a
                                        className={`nav-link ${activeTab === 'password' ? 'active' : ''}`}
                                        onClick={() => setActiveTab('password')}
                                        data-bs-toggle="tab"
                                        href="#home2"
                                    >
                                        Change Password
                                    </a>
                                </li>
                            </ul>
                        </div>
                        <div className="tab-content">
                            <div id="home1" className={`tab-pane fade ${activeTab === 'general' ? 'show active' : ''}`}>
                                <div className="form-design">
                                    <form onSubmit={handleGeneralSettingsSubmit}>
                                        <div className="row">
                                           <div className="col-md-12">
                                                <div className="form-group">
                                                    <label className="form-label">
                                                    {(generalSettings.roleName == 'company_admin') ? 'Company Logo' : 'Profile Image'}
                                                    </label>
                                                    <div className="profile-img">
                                                    <div className="circle">
                                                        <img
                                                        className="profile-pic"
                                                        src={
                                                            (generalSettings.roleName == 'company_admin' && generalSettings.companyLogoUrl)
                                                            ? generalSettings.companyLogoUrl
                                                            : generalSettings.profileImage || '/user/images/no-image.webp'
                                                        }
                                                        alt="Display"
                                                        />
                                                    </div>
                                                    <div
                                                        className="p-image"
                                                        onClick={() => {
                                                        document.getElementById('uploadInput')?.click();
                                                        }}
                                                        style={{ cursor: 'pointer' }}
                                                    >
                                                        <img
                                                        src="/user/images/uploadfile.svg"
                                                        className="img-fluid upload-buttons"
                                                        alt="Upload"
                                                        />
                                                    </div>
                                                    <input
                                                        id="uploadInput"
                                                        className="file-upload"
                                                        type="file"
                                                        accept="image/*"
                                                        name={(generalSettings.roleName == 'company_admin') ? 'companyLogoUrl' : 'profileImage'}
                                                        onChange={handleGeneralSettingsFileChange}
                                                        style={{ display: 'none' }}
                                                    />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="col-md-6">
                                                <div className="form-group">
                                                    <label className="form-label">Company Name</label>
                                                    <input
                                                        type="text"
                                                        className={`form-control ${errors.companyName ? 'is-invalid' : ''}`}
                                                        name="companyName"
                                                        placeholder="Company Name"
                                                        value={generalSettings.companyName}
                                                        onChange={handleGeneralSettingsChange}
                                                    />
                                                    {errors.companyName && <div className="invalid-feedback">{errors.companyName}</div>}
                                                </div>
                                            </div>
                                            <div className="col-md-6">
                                                <div className="form-group">
                                                    <label className="form-label">Full Name</label>
                                                    <input
                                                        type="text"
                                                        className={`form-control ${errors.fullName ? 'is-invalid' : ''}`}
                                                        name="fullName"
                                                        placeholder="Full Name"
                                                        value={generalSettings.fullName}
                                                        onChange={handleGeneralSettingsChange}
                                                    />
                                                    {errors.fullName && <div className="invalid-feedback">{errors.fullName}</div>}
                                                </div>
                                            </div>
                                            <div className="col-md-6">
                                                <div className="form-group">
                                                    <label className="form-label">Email Address</label>
                                                    <input
                                                        type="email"
                                                        className={`form-control ${errors.emailAddress ? 'is-invalid' : ''}`}
                                                        name="emailAddress"
                                                        placeholder="Email Address"
                                                        value={generalSettings.emailAddress}
                                                        onChange={handleGeneralSettingsChange}
                                                    />
                                                    {errors.emailAddress && <div className="invalid-feedback">{errors.emailAddress}</div>}
                                                </div>
                                            </div>
                                            <div className="col-md-6">
                                                <Input
                                                    label="Phone Number"
                                                    type="text"
                                                    name="phoneNumber"
                                                    value={generalSettings.phoneNumber}
                                                    onChange={handleGeneralSettingsChange}
                                                    leftAddon={
                                                        <select
                                                            name="countryCodeid"
                                                            value={generalSettings.countryCodeid}
                                                            onChange={handleGeneralSettingsChange}
                                                            className="form-select form-control"
                                                        >
                                                            <option value="">Select Code</option>
                                                            {countryList.map((country) => (
                                                                <option key={country.id} value={country.id}>
                                                                    {country.phonecode}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    }
                                                />
                                            </div>
                                        </div>
                                        <div className="addentry-btn">
                                            <button type="submit" className="btn btn-info" disabled={loading}>
                                                {loading ? 'Updating...' : 'Submit'}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                            <div id="home2" className={`tab-pane fade ${activeTab === 'password' ? 'show active' : ''}`}>
                                <div className="form-design">
                                    <form onSubmit={handlePasswordSubmit}>
                                        <div className="row">
                                            <div className="col-md-12">
                                                <div className="form-group">
                                                    <label className="form-label">Current Password</label>
                                                    <input
                                                        type="password"
                                                        className={`form-control ${errors.currentPassword ? 'is-invalid' : ''}`}
                                                        name="currentPassword"
                                                        placeholder="Current Password"
                                                        value={passwordForm.currentPassword}
                                                        onChange={handlePasswordChange}
                                                    />
                                                    {errors.currentPassword && <div className="invalid-feedback">{errors.currentPassword}</div>}
                                                </div>
                                            </div>
                                            <div className="col-md-6">
                                                <div className="form-group">
                                                    <label className="form-label">New Password</label>
                                                    <input
                                                        type="password"
                                                        className={`form-control ${errors.newPassword ? 'is-invalid' : ''}`}
                                                        name="newPassword"
                                                        placeholder="New Password"
                                                        value={passwordForm.newPassword}
                                                        onChange={handlePasswordChange}
                                                    />
                                                    {errors.newPassword && <div className="invalid-feedback">{errors.newPassword}</div>}
                                                </div>
                                            </div>
                                            <div className="col-md-6">
                                                <div className="form-group">
                                                    <label className="form-label">Confirm New Password</label>
                                                    <input
                                                        type="password"
                                                        className={`form-control ${errors.confirmPassword ? 'is-invalid' : ''}`}
                                                        name="confirmPassword"
                                                        placeholder="Confirm New Password"
                                                        value={passwordForm.confirmPassword}
                                                        onChange={handlePasswordChange}
                                                    />
                                                    {errors.confirmPassword && <div className="invalid-feedback">{errors.confirmPassword}</div>}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="addentry-btn">
                                            <button type="submit" className="btn btn-info" disabled={loading}>
                                                {loading ? 'Updating...' : 'Submit'}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default SettingsPage;
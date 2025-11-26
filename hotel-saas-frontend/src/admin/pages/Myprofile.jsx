import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

const Myprofile = () => {
    const navigate = useNavigate();

    const [form, setForm] = useState({
        name: '',
        email: '',
        phone: '',
        countryCodeid: '',
    });

    const [profilePictureFile, setProfilePictureFile] = useState(null);
    const [existingImageUrl, setExistingImageUrl] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [countryList, setCountryList] = useState([]);

    
    // --- API: Fetch Country List ---
    const fetchCountryList = async () => {
        try {
            const response = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/country-list`);
            const data = response.data;

            if (data.status === 'success' && Array.isArray(data.results)) {
                setCountryList(data.results.map(c => ({
                    ...c,
                    minLength: c.minLength || 8,
                    maxLength: c.maxLength || 15
                })));
            } else {
                toast.error(data.message || 'Failed to fetch countries.');
            }
        } catch (err) {
            console.error('Failed to fetch countries:', err);
            toast.error('Failed to fetch countries due to network error.');
        }
    };
  
    // --- API: Fetch Profile Data ---
    const fetchProfileData = useCallback(async () => {
        const token = localStorage.getItem('admin_token');
        setIsLoading(true);

        if (!token) {
            toast.error('Authentication token not found. Redirecting to login.');
            navigate('/admin/login');
            return;
        }

        try {
            const response = await axios.get(
                `${process.env.REACT_APP_API_BASE_URL}/api/admin/my-profile`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            const user = response.data.user;

            setForm({
                name: user.name || '',
                email: user.email || '',
                phone: user.phone || '',
                countryCodeid: user.countryCodeid || '', 
            });

            localStorage.setItem('admin_user', JSON.stringify(user));

            // Add timestamp to force browser to fetch new image
            setExistingImageUrl(user.profile ? `${user.profile}?t=${Date.now()}` : '');

        } catch (error) {
            console.error('Error fetching profile data:', error);
            if (error.response?.status === 401) {
                toast.error('Session expired. Please log in again.');
                navigate('/admin/login');
            } else {
                toast.error('An unexpected error occurred while loading your profile.');
            }
        } finally {
            setIsLoading(false);
        }
    }, [navigate]);

      useEffect(() => {
    fetchCountryList();
    fetchProfileData();
}, [fetchProfileData]);




    const handleSubmit = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('admin_token');
        if (!token) return toast.error('Authentication error');

        const formData = new FormData();
        formData.append('name', form.name);
        formData.append('email', form.email);
        formData.append('phone', form.phone);
        formData.append('countryCodeid', form.countryCodeid);
        if (profilePictureFile) formData.append('profile', profilePictureFile);

        try {
            const response = await axios.put(
                `${process.env.REACT_APP_API_BASE_URL}/api/admin/my-profile`,
                formData,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.status === 'success') {
                 localStorage.setItem('admin_user', JSON.stringify(response.data.user));
                fetchProfileData()
                toast.success('Profile updated successfully');
            } else {
                toast.error(response.data.message || 'Failed to update profile');
            }
        } catch (err) {
            console.error(err);
            toast.error('Error updating profile');
        }
    };

    const handleChange = (e) => {
        const { name, value, files } = e.target;

        if (name === 'profilePicture' && files && files[0]) {
            const file = files[0];

            // Update the file in state
            setProfilePictureFile(file);

            // Update the preview immediately
            setExistingImageUrl(URL.createObjectURL(file));
        } else {
            // Update text inputs
            setForm(prev => ({ ...prev, [name]: value }));
        }
    };


    const handleCancel = () => {
        fetchProfileData();
        setProfilePictureFile(null);
        toast.info('Update cancelled. Fields reset to original values.');
    };

    if (isLoading) {
        return <div className="layout-px-spacing">Loading profile data...</div>;
    }

    return (
        <div>
            <div className="layout-px-spacing">
                <div className="page-header d-flex justify-content-between">
                    <div className="page-title">
                        <h3>My Profile</h3>
                    </div>
                    <div className="page-title page-btn">
                        <Link className="btn btn-primary" to="/admin/dashboard">
                            Back to Dashboard
                        </Link>
                    </div>
                </div>

                <div className="account-settings-container layout-top-spacing">
                    <div className="layout-spacing">
                        <div className="general-info section general-infomain">
                            <form onSubmit={handleSubmit}>
                                <div className="account-content mt-2 mb-2">
                                    <div className="row">
                                        <div className="col-xl-4 col-lg-5 col-md-5 layout-spacing">
                                            <div className="section general-info">
                                                <div className="info">
                                                    <div className="user-management-title mb-3">
                                                        <h4>Profile Picture</h4>
                                                    </div>
                                                    <div className="d-flex flex-column align-items-center mb-4">
                                                        <div className="profile-img-container mb-3" style={{ width: '150px', height: '150px', overflow: 'hidden', borderRadius: '50%', border: '2px solid #ddd' }}>
                                                            {existingImageUrl ? (
                                                                <img
                                                                    src={existingImageUrl}
                                                                    alt="Profile Preview"
                                                                    className="img-fluid"
                                                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                                />
                                                            ) : (
                                                                <div className="d-flex align-items-center justify-content-center h-100 bg-light text-secondary">
                                                                    No Image
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="form-group w-100">
                                                            <label htmlFor="profilePicture" className="text-center w-100">Upload New Image</label>
                                                            <input
                                                                type="file"
                                                                id="profilePicture"
                                                                name="profilePicture"
                                                                className="form-control-file"
                                                                accept="image/*"
                                                                onChange={handleChange}   // ✅ Add this
                                                            />


                                                            <small className="form-text text-muted text-center mt-2">Max 2MB. JPG, PNG only.</small>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="col-xl-8 col-lg-7 col-md-7 layout-spacing">
                                            <div className="section general-info">
                                                <div className="info">
                                                    <div className="user-management-title">
                                                        <h4>Personal Details</h4>
                                                    </div>
                                                    <div className="row">
                                                        <div className="col-md-6">
                                                            <div className="form-group">
                                                                <label htmlFor="name">Name</label>
                                                                <input
                                                                    type="text"
                                                                    id="name"
                                                                    name="name"
                                                                    className="form-control"
                                                                    value={form.name}
                                                                    onChange={handleChange}
                                                                    required
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="col-md-6">
                                                            <div className="form-group">
                                                                <label htmlFor="email">Email</label>
                                                                <input
                                                                    type="email"
                                                                    id="email"
                                                                    name="email"
                                                                    className="form-control"
                                                                    value={form.email}
                                                                    onChange={handleChange}
                                                                    required
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="row">
                                                        <div className="col-md-3">
                                                            <div className="form-group">
                                                                <label htmlFor="countryCodeid">Code</label>
                                                               <select
                                                                    id="countryCodeid"
                                                                    name="countryCodeid"
                                                                    className="form-control"
                                                                    value={form.countryCodeid}   // this is now the ID
                                                                    onChange={handleChange}
                                                                >
                                                                    <option value="" disabled>Select</option>
                                                                    {countryList.map((country) => (
                                                                        <option key={country.id} value={country.id}>
                                                                            {country.phonecode} - {country.name}
                                                                        </option>
                                                                    ))}
                                                                </select>

                                                            </div>
                                                        </div>
                                                        <div className="col-md-9">
                                                            <div className="form-group">
                                                                <label htmlFor="phone">Phone Number</label>
                                                                <input
                                                                    type="text"
                                                                    id="phone"
                                                                    name="phone"
                                                                    className="form-control"
                                                                    value={form.phone}
                                                                    onChange={handleChange}
                                                                />
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
                                        <button type="button" className="btn btn-warning" onClick={handleCancel}>Cancel</button>
                                        <button type="submit" className="btn btn-primary">Update Details</button>
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

export default Myprofile;

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

const UserManagementEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
    company_id: '',
    status: '1',
    profile: null,
  });

  const [previewImage, setPreviewImage] = useState('');

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const { data } = await axios.get(
        `${process.env.REACT_APP_API_BASE_URL}/api/admin/user-management/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const user = data.results;
      setForm({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        role: user.role || '',
        company_id: user.company_id || '',
        status: user.is_active ? '1' : '2',
        profile: null,
      });
      setPreviewImage(user.profile || '');
    } catch (err) {
      console.error('Error fetching user:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    if (type === 'file') {
      const file = files[0];
      setForm((prev) => ({ ...prev, [name]: file }));
      setPreviewImage(URL.createObjectURL(file));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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
      const message =
        err?.response?.data?.message || 'An unexpected error occurred';
      toast.error(message);
    }
  };

  return (
    <div id="content" className="main-content">
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
                                  <div className="upload pr-md-4 text-center">
                                    <input
                                      type="file"
                                      name="profile"
                                      className="dropify"
                                      onChange={handleChange}
                                      accept="image/*"
                                      {...(previewImage ? { 'data-default-file': previewImage } : {})}
                                    />
                                    <p className="mt-2">
                                      <i className="flaticon-cloud-upload mr-1"></i>Upload Picture
                                    </p>
                                  </div>
                                </div>


                                <div className="col-xl-10 col-lg-12 col-md-8 mt-md-0 mt-4">
                                  <div className="form">
                                    <div className="row">
                                      <div className="col-sm-6">
                                        <div className="form-group">
                                          <label>Name</label>
                                          <input
                                            type="text"
                                            name="name"
                                            className="form-control"
                                            value={form.name}
                                            onChange={handleChange}
                                            required
                                          />
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
                                            required
                                          />
                                        </div>
                                      </div>
                                      <div className="col-sm-6">
                                        <div className="form-group">
                                          <label>Phone</label>
                                          <input
                                            type="text"
                                            name="phone"
                                            className="form-control"
                                            value={form.phone}
                                            onChange={handleChange}
                                          />
                                        </div>
                                      </div>
                                      <div className="col-sm-6">
                                        <div className="form-group">
                                          <label>Role</label>
                                          <select
                                            name="role"
                                            className="form-control"
                                            value={form.role}
                                            onChange={handleChange}
                                            required
                                          >
                                            <option value="">Select Role</option>
                                            <option value="company_admin">Company Admin</option>
                                            <option value="revenue_manager">Revenue Manager</option>
                                            <option value="general_manager">General Manager</option>
                                            <option value="analyst">Analyst</option>
                                          </select>
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
                                      <div className="col-sm-6">
                                        <div className="form-group">
                                          <label>Company</label>
                                          <select
                                            name="company_id"
                                            className="form-control"
                                            value={form.company_id}
                                            onChange={handleChange}
                                            required
                                          >
                                            <option value="">Select Company</option>
                                            <option value="abf33f3f-fdc3-4f9d-abac-166b6d4c6615">Charles Pena Inc</option>
                                            <option value="b52cc5ca-ce7f-468b-b4ce-135b3d45a504">Tech Innovators</option>
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
                    <button type="reset" className="btn btn-warning">Reset All</button>
                    <button type="submit" className="btn btn-primary">Update</button>
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

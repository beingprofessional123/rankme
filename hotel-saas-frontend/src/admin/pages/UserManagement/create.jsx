import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const UserManagementCreate = () => {
  const navigate = useNavigate();
  const [countryList, setCountryList] = useState([]);
  const [userRolelist, setUserRoleList] = useState([]);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    countryCodeid: '',
    company_name: '',
    profile: null,
    role_id: '',
    status: '1', // '1' for active, '0' for inactive
  });



  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    if (type === 'file') {
      setForm((prev) => ({ ...prev, [name]: files[0] }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const fetchCountryList = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/country-list`);
      const data = await response.json();
      if (data.status === 'success') {
        setCountryList(data.results); // use "results" instead of "data"
      }
    } catch (err) {
      console.error('Failed to fetch countries:', err);
    }
  };

  const fetchUserRolelist = async () => {
    try {
      const token = localStorage.getItem('admin_token'); // assuming roles endpoint is protected

      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/admin/roles-list`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.status === 'success') {
        setUserRoleList(data.results);
      } else {
        console.error('Error fetching roles:', data.message);
      }
    } catch (err) {
      console.error('Failed to fetch roles:', err);
    }
  };


  useEffect(() => {
    fetchCountryList();
    fetchUserRolelist();
  }, []);



  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('admin_token');
    const formData = new FormData();

    for (let key in form) {
      formData.append(key, form[key]);
    }

    try {
      await axios.post(`${process.env.REACT_APP_API_BASE_URL}/api/admin/user-management`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });
      navigate('/admin/user-management');
    } catch (error) {
      console.error('Error creating user:', error);
    }
  };

  return (
    <div>
      <div className="layout-px-spacing">
        <div className="page-header d-flex justify-content-between">
          <div className="page-title">
            <h3>Create</h3>
          </div>
          <div className="page-title page-btn">
            <Link className="btn btn-primary" to="/admin/user-management">Back</Link>
          </div>
        </div>
        <div className="account-settings-container layout-top-spacing">
          <div className="layout-spacing">
            <div className="general-info section general-infomain">
              {/* <div className="alert alert-success mt-2 mb-2 successMessage"></div> */}
              <form onSubmit={handleSubmit} encType="multipart/form-data">
                <div className="account-content mt-2 mb-2">
                  <div className="scrollspy-example" data-spy="scroll" data-target="#account-settings-scroll" data-offset="-100">
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
                                      <input
                                        type="file"
                                        name="profile"
                                        className="dropify"
                                        onChange={handleChange}
                                        accept="image/*"
                                      />
                                      <p className="mt-2"><i
                                        className="flaticon-cloud-upload mr-1"></i>
                                        Upload Picture</p>
                                    </div>
                                  </div>
                                  <div className="col-xl-10 col-lg-12 col-md-8 mt-md-0 mt-4">
                                    <div className="form">
                                      <div className="row">
                                        <div className="col-sm-6">
                                          <div className="form-group">
                                            <label>Company name</label>
                                            <input
                                              type="text"
                                              name="company_name"
                                              className="form-control"
                                              value={form.company_name}
                                              onChange={handleChange}
                                            />
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
                                                  {country.phonecode} {country.short_name}
                                                </option>
                                              ))}
                                            </select>
                                          </div>
                                        </div>

                                        <div className="col-sm-4">
                                          <div className="form-group">
                                            <label>Phone</label>
                                            <div className="input-group">
                                              <div className="input-group-prepend">
                                                <span className="input-group-text">
                                                  {
                                                    countryList.find(c => c.id === form.countryCodeid)?.phonecode || '+'
                                                  }
                                                </span>
                                              </div>
                                              <input
                                                type="text"
                                                name="phone"
                                                className="form-control"
                                                value={form.phone}
                                                onChange={handleChange}
                                                placeholder="Enter phone number"
                                              />
                                            </div>
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

                                        <div className="col-sm-12">
                                          <div className="form-group">
                                            <label>Password</label>
                                            <input
                                              type="password"
                                              name="password"
                                              className="form-control"
                                              value={form.password}
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
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="account-settings-footer">
                  <div className="as-footer-container">
                    <button type="reset" className="btn btn-warning">Reset All</button>
                    <button type="submit" className="btn btn-primary">Create</button>
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

export default UserManagementCreate;

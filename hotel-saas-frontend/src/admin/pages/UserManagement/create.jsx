  import React, { useState, useEffect, useRef } from 'react';
  import { useNavigate, Link } from 'react-router-dom';
  import axios from 'axios';
  import { toast } from 'react-toastify';
  import 'react-toastify/dist/ReactToastify.css';

  const UserManagementCreate = () => {
      const navigate = useNavigate();
      const [countryList, setCountryList] = useState([]);
      const [userRolelist, setUserRoleList] = useState([]);
      const [loading, setLoading] = useState(false);
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
      const [errors, setErrors] = useState({});
      const fileInputRef = useRef(null);

      // Max length and size constants
      const MAX_NAME_LENGTH = 40;
      const MAX_EMAIL_LENGTH = 60;
      const MAX_PASSWORD_LENGTH = 50;
      const MAX_PHONE_LENGTH = 15;
      const MAX_COMPANY_NAME_LENGTH = 40;
      const MAX_IMAGE_SIZE_MB = 2; // 2 MB

      const validate = () => {
          let newErrors = {};

          // Name validation
          if (!form.name.trim()) {
              newErrors.name = 'Name is required.';
          } else if (form.name.length > MAX_NAME_LENGTH) {
              newErrors.name = `Name must be less than ${MAX_NAME_LENGTH} characters.`;
          }

          // Email validation
          if (!form.email.trim()) {
              newErrors.email = 'Email is required.';
          } else if (!/\S+@\S+\.\S+/.test(form.email)) {
              newErrors.email = 'Email address is invalid.';
          } else if (form.email.length > MAX_EMAIL_LENGTH) {
              newErrors.email = `Email must be less than ${MAX_EMAIL_LENGTH} characters.`;
          }

          // Password validation
          if (!form.password) {
              newErrors.password = 'Password is required.';
          } else if (form.password.length < 6 || form.password.length > MAX_PASSWORD_LENGTH) {
              newErrors.password = 'Password must be between 6 and 50 characters.';
          }

          // Phone validation
            const selectedCountry = countryList.find(c => c.id === form.countryCodeid);
            const phoneLength = form.phone.length;

            if (form.phone.trim() && !/^\d+$/.test(form.phone)) {
                newErrors.phone = 'Phone number can only contain digits.';
            } else if (selectedCountry) {
                if (phoneLength < selectedCountry.minLength || phoneLength > selectedCountry.maxLength) {
                    newErrors.phone = `Phone number must be between ${selectedCountry.minLength} and ${selectedCountry.maxLength} digits.`;
                }
            }

          // Company name validation
          if (form.company_name.length > MAX_COMPANY_NAME_LENGTH) {
              newErrors.company_name = `Company name must be less than ${MAX_COMPANY_NAME_LENGTH} characters.`;
          }

          // Role validation
          if (!form.role_id) {
              newErrors.role_id = 'Role is required.';
          }

          setErrors(newErrors);
          return Object.keys(newErrors).length === 0;
      };

      const handleFileChange = (file) => {
          let newErrors = { ...errors };

          if (file) {
              // File type validation
              newErrors.profile = '';
              const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
              if (!allowedTypes.includes(file.type)) {
                  newErrors.profile = 'Please select a JPG, JPEG, or PNG image.';
                  setForm(prev => ({ ...prev, profile: null }));
                  setErrors(newErrors);
                  return;
              }

              // File size validation (max 2MB)
              if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
                  newErrors.profile = `File size must be less than ${MAX_IMAGE_SIZE_MB}MB.`;
                  setForm(prev => ({ ...prev, profile: null }));
                  setErrors(newErrors);
                  return;
              }
              
          } else {
              newErrors.profile = '';
          }

          setForm(prev => ({ ...prev, profile: file }));
          setErrors(newErrors);
      };

      const handleChange = (e) => {
        const { name, value, files } = e.target;
        let newErrors = { ...errors };

        // Handle file input separately
        if (name === 'profile') {
            handleFileChange(files[0]);
            return;
        }

        let maxLength;
        switch (name) {
            case 'name':
                maxLength = MAX_NAME_LENGTH;
                break;
            case 'email':
                maxLength = MAX_EMAIL_LENGTH;
                break;
            case 'password':
                maxLength = MAX_PASSWORD_LENGTH;
                break;
            case 'phone':
                maxLength = MAX_PHONE_LENGTH;
                break;
            case 'company_name':
                maxLength = MAX_COMPANY_NAME_LENGTH;
                break;
            default:
                // No max length for this field
                maxLength = Infinity;
        }

        // Check if the new value exceeds the max length before updating the state
        if (value.length <= maxLength) {
            setForm(prev => ({ ...prev, [name]: value }));
            // Clear the error message if the length is now valid
            if (newErrors[name]) {
                delete newErrors[name];
            }
        } else {
            // Set an error message if the limit is reached
            newErrors[name] = `Maximum ${maxLength} characters allowed.`;
        }

        // You can keep the real-time validation logic here, but the length check is already handled above.
        // This part can be simplified. Let's simplify the switch statement
        // to primarily handle the length and other specific validations.
        switch (name) {
            case 'email':
                if (value.length > 0 && !/\S+@\S+\.\S+/.test(value)) {
                    newErrors.email = 'Email address is invalid.';
                } else {
                    delete newErrors.email;
                }
                break;
            case 'phone':
                if (value.length > 0 && !/^\d*$/.test(value)) {
                    newErrors.phone = 'Phone number can only contain digits.';
                } else {
                    delete newErrors.phone;
                }
                break;
            case 'role_id':
                if (!value) {
                    newErrors.role_id = 'Role is required.';
                } else {
                    delete newErrors.role_id;
                }
                break;
            default:
                // No additional real-time validation needed
                break;
        }
        
        // Check required fields when they are emptied
        if (e.target.required && !value.trim()) {
            newErrors[name] = `${name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())} is required.`;
        }

        setErrors(newErrors);
    };


      const fetchCountryList = async () => {
          try {
              const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/country-list`);
              const data = await response.json();
              if (data.status === 'success') {
                //   setCountryList(data.results);
                setCountryList(data.results.map(c => ({
                    ...c,
                    minLength: c.minLength || 8,  // fallback if backend doesn't send
                    maxLength: c.maxLength || 15
                })));
              } else {
                  toast.error('Failed to fetch countries.');
              }
              
          } catch (err) {
              console.error('Failed to fetch countries:', err);
              toast.error('Failed to fetch countries.');
          }
      };

      const fetchUserRolelist = async () => {
          try {
              const token = localStorage.getItem('admin_token');
              const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/admin/roles-list`, {
                  headers: {
                      Authorization: `Bearer ${token}`,
                  },
              });
              const data = await response.json();
              if (data.status === 'success') {
                  setUserRoleList(data.results);
              } else {
                  toast.error('Failed to fetch roles.');
              }
          } catch (err) {
              console.error('Failed to fetch roles:', err);
              toast.error('Failed to fetch roles.');
          }
      };

      useEffect(() => {
          fetchCountryList();
          fetchUserRolelist();
      }, []);

      const handleReset = () => {
        setForm({
          name: '',
          email: '',
          password: '',
          phone: '',
          countryCodeid: '',
          company_name: '',
          profile: null,
          role_id: '',
          status: '1',
        });
        setErrors({});
        if (fileInputRef.current) {
            fileInputRef.current.value = ""; // clears file input
        }
        if (window.$ && fileInputRef.current) {
            const dropifyInstance = window.$(fileInputRef.current).data('dropify');
            if (dropifyInstance) {
                dropifyInstance.resetPreview();
                dropifyInstance.clearElement();
            }
        }
      };


      const handleSubmit = async (e) => {
          e.preventDefault();
          if (!validate()) {
              toast.error('Please correct the form errors.');
              return;
          }
            setLoading(true);
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
              toast.success('User created successfully!');
              navigate('/admin/user-management');
          } catch (error) {
              console.error('Error creating user:', error);
              const message = error.response?.data?.message || 'An unexpected error occurred.';
              toast.error(message);
              setLoading(false);
          }
      };

      return (
          <div>
              <div className="layout-px-spacing">
                  <div className="page-header d-flex justify-content-between">
                      <div className="page-title">
                          <h3>Create User</h3>
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
                                                                                  accept="image/jpeg,image/jpg,image/png"
                                                                                  ref={fileInputRef}
                                                                              />
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
                                                                                              required
                                                                                              maxLength={MAX_NAME_LENGTH}
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
                                                                                              required
                                                                                              maxLength={MAX_EMAIL_LENGTH}
                                                                                          />
                                                                                          {errors.email && <div className="text-danger">{errors.email}</div>}
                                                                                      </div>
                                                                                  </div>
                                                                                  <div className="col-sm-6">
                                                                                      <div className="form-group">
                                                                                          <label>Password</label>
                                                                                          <input
                                                                                              type="password"
                                                                                              name="password"
                                                                                              className="form-control"
                                                                                              value={form.password}
                                                                                              onChange={handleChange}
                                                                                              required
                                                                                              maxLength={MAX_PASSWORD_LENGTH}
                                                                                          />
                                                                                          {errors.password && <div className="text-danger">{errors.password}</div>}
                                                                                      </div>
                                                                                  </div>
                                                                                  <div className="col-sm-6">
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
                                                                                                      {country.phonecode} - {country.name}
                                                                                                  </option>
                                                                                              ))}
                                                                                          </select>
                                                                                          {errors.countryCodeid && <div className="text-danger">{errors.countryCodeid}</div>}
                                                                                      </div>
                                                                                  </div>
                                                                                  <div className="col-sm-6">
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
                                                                                                  maxLength={
                                                                                                        countryList.find(c => c.id === form.countryCodeid)?.maxLength || MAX_PHONE_LENGTH
                                                                                                    }
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
                                  </div>
                                  <div className="account-settings-footer">
                                      <div className="as-footer-container">
                                          <button type="button" className="btn btn-warning" onClick={handleReset}>Reset All</button>
                                          <button type="submit" className="btn btn-primary" disabled={loading} >{loading ? 'Creating...' : 'Create'}</button>
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
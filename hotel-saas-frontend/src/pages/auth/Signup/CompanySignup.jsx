// src/pages/auth/CompanySignup.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Input from '../../../components/forms/Input';
import Button from '../../../components/forms/Button';
import AuthLayout from '../../../layouts/AuthLayout';
import { useNavigate } from 'react-router-dom';
import logo from '../../../assets/images/logo.png';
import eyeHide from '../../../assets/images/eye-hide.svg';
import eyeShow from '../../../assets/images/eye-show.svg';

const CompanySignup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    companyName: '',
    fullName: '',
    email: '',
    phone: '',
    password: '',
  });

  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    document.body.classList.add('loginbg');
    return () => {
      document.body.classList.remove('loginbg');
    };
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    // Clear specific field errors on change
    if (errors[e.target.name]) {
      setErrors((prevErrors) => {
        const newErrors = { ...prevErrors };
        delete newErrors[e.target.name];
        return newErrors;
      });
    }
    setGeneralError(''); // Clear general error on input change
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.companyName.trim()) {
      newErrors.companyName = 'Please enter a company name.';
    }
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Please enter a full name.';
    }
    if (!formData.email) {
      newErrors.email = 'Please enter an email address.';
    } else if (
      !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formData.email)
    ) {
      newErrors.email = 'Please enter a valid email address.';
    }
    if (!formData.phone) {
      newErrors.phone = 'Please enter a phone number.';
    } else if (!/^\d{10,15}$/.test(formData.phone)) {
      newErrors.phone = 'Phone number must be 10-15 digits.';
    }
    if (!formData.password) {
      newErrors.password = 'Please enter a password.';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters long.';
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneralError('');

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});

    try {
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          companyName: formData.companyName,
          name: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          role: 'company_admin',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.errors) {
          const mappedErrors = {};
          for (const key in data.errors) {
            if (Object.hasOwnProperty.call(data.errors, key)) {
              mappedErrors[key] = data.errors[key][0] || data.errors[key];
            }
          }
          setErrors(mappedErrors);
        } else {
          setGeneralError(data.message || 'Signup failed. Please try again.');
        }
        return;
      }
      console.log(data);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      navigate('/subscription');
    } catch (error) {
      setGeneralError('Network error. Please check your internet connection and try again.');
      console.error(error);
    }
  };

  return (
    <AuthLayout>
      <div className="loginmain signupmain">
        <div className="logo">
          <Link to="/">
            <img src={logo} className="img-fluid" alt="RankMeOne Logo" />
          </Link>
        </div>
        <div className="loginbg-w">
          <h1>Create an account</h1>
          <div className="form-design">
            <form onSubmit={handleSubmit}>
              {generalError && (
                <div className="text-red-600 text-sm mb-4 text-center">
                  {generalError}
                </div>
              )}

              <Input
                label="Company Name"
                name="companyName"
                value={formData.companyName}
                onChange={handleChange}
                placeholder="Enter your company name"
                error={errors.companyName}
              />

              <Input
                label="Full Name"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="Enter your full name"
                error={errors.fullName}
              />

              <div className="row">
                <div className="col-md-6">
                  <Input
                    label="Email Address"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="name@example.com"
                    error={errors.email}
                  />
                </div>
                <div className="col-md-6">
                  <Input
                    label="Phone Number"
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="e.g., 9876543210"
                    error={errors.phone} // This is correctly passed now
                  />
                  {/* REMOVE THIS LINE: The error is now handled by the Input component itself */}
                  {/* {errors.phone && (<div className="text-red-600 text-sm mt-1">{errors.phone}</div>)} */}
                </div>
              </div>

              {/* Password field requires special handling because of the eye icon */}
              {/* You have two options here: */}
              {/* OPTION 1 (Recommended): Adjust your Input component to accept children or an icon prop */}
              {/* OPTION 2 (Current approach, with correction): Keep the input and icon separate, but render the error outside */}
              {/* For now, we will go with Option 2 and just correct the error rendering. */}

              <div className="form-group">
                <label className="form-label">Password</label>
                <div className="password-icon">
                  <input // Directly use input here since Input component doesn't wrap the eye icon
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Create a password"
                    className={`form-control ${errors.password ? 'is-invalid' : ''}`} // Add Bootstrap validation class
                  />
                  <img
                    src={showPassword ? eyeShow : eyeHide}
                    className="img-fluid"
                    alt={showPassword ? 'Hide password' : 'Show password'}
                    onClick={togglePasswordVisibility}
                    style={{ cursor: 'pointer' }}
                  />
                </div>
                {errors.password && ( // Keep this error div as it's not inside the Input component
                  <div className="invalid-feedback d-block">{errors.password}</div> // Use d-block to force display
                )}
              </div>

              <div className="login-btn">
                <Button type="submit" className="btn btn-info">
                  Next
                </Button>
              </div>
            </form>
            <h5 className="mt-4">
              Already have an account? <Link to="/login">Sign In</Link>
            </h5>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
};

export default CompanySignup;
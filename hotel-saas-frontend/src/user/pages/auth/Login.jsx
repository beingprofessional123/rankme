// src/pages/auth/Login.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom'; // Import Link
import axios from 'axios';
import Input from '../../components/forms/Input';
import Button from '../../components/forms/Button';
import AuthLayout from '../../layouts/AuthLayout';

const Login = () => {
  const navigate = useNavigate();
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false); // State for password visibility

  const [searchParams] = useSearchParams();

  const [formData, setFormData] = useState({
    email: searchParams.get('email') || '',
    password: searchParams.get('password') || ''
  });

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  useEffect(() => {
    const checkLoginAndRedirect = async () => {
      const token = localStorage.getItem('token');
      const user = localStorage.getItem('user');

      if (!token || !user) {
        navigate('/login');
        return;
      }

      try {
        const response = await axios.get(
          `${process.env.REACT_APP_API_BASE_URL}/api/company/subscriptions-by-user`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const { results: subscription, hotelExists } = response.data;

        if (subscription?.subscriptionPlan?.billing_period === 'free' && subscription?.status === 'active') {
          if (hotelExists) {
            navigate('/dashboard');
          } else {
            navigate('/setup/setup-wizard');
          }
        } else {
          const isSubscriptionActive =
            subscription?.status === 'active' && new Date(subscription?.expires_at) > new Date();

          if (isSubscriptionActive) {
            if (hotelExists) {
              navigate('/dashboard');
            } else {
              navigate('/setup/setup-wizard');
            }
          } else {
            navigate('/subscription');
          }
        }

      } catch (error) {
        console.error('Error fetching subscription:', error);
        navigate('/login');
      }
    };

    checkLoginAndRedirect();
  }, []);



  // Add/remove 'loginbg' class to the body
  useEffect(() => {
    document.body.classList.add('loginbg');
    return () => {
      document.body.classList.remove('loginbg');
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { email, password } = formData;
    const newErrors = {};

    // Field validation
    if (!email) newErrors.email = 'Please enter an email';
    if (!password) newErrors.password = 'Please enter a password';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({}); // Clear previous errors

    try {
      const response = await axios.post(`${process.env.REACT_APP_API_BASE_URL}/api/login`, {
        email,
        password,
      });

      const data = response.data;
      localStorage.setItem('token', data.token);
      const userWithCompanyId = {
        ...data.user,
        company_id: data.user.company?.id || null // optional chaining in case company is undefined
      };
      if (userWithCompanyId.profile_image) {
        userWithCompanyId.profile_image = `${process.env.REACT_APP_API_BASE_URL}/${userWithCompanyId.profile_image}`;
      }

      if (userWithCompanyId.company?.logo_url) {
        userWithCompanyId.company.logo_url = `${process.env.REACT_APP_API_BASE_URL}/${userWithCompanyId.company.logo_url}`;
      }
      localStorage.setItem('user', JSON.stringify(userWithCompanyId));

      // Redirect based on user role
      switch (data.user.role) {
        // case 'super_admin':
        //   window.location.href = '/admin';
        //   break;
        case 'company_admin':
          window.location.href = '/subscription';
          break;
        case 'revenue_manager':
          window.location.href = '/dashboard';
          break;
        case 'general_manager':
          window.location.href = '/dashboard';
          break;
        case 'analyst':
          window.location.href = '/dashboard';
          break;
        default:
          window.location.href = '/';
      }
    } catch (error) {
      console.error(error);
      const message = error.response?.data?.message || 'Login failed';
      setErrors({ general: message });
    }
  };

  return (
    // AuthLayout will now just provide a wrapper, not the background styles.
    // The 'loginbg' class on the body will handle the main background.
    <AuthLayout>
      <div className="loginmain"> {/* This wraps the entire login content */}
        <div className="logo">
          <a href="#">
            <img
              src={`/user/images/logo.png`}
              className="img-fluid"
              alt="RankMeOne Logo"
            />
          </a>
        </div>
        <div className="loginbg-w"> {/* This is the white background box */}
          <h1>Log in to your account</h1> {/* Changed h2 to h1 as per HTML */}
          {errors.general && (
            <div className="text-danger small text-center mt-3">{errors.general}</div>
          )}
          <div className="form-design">
            <form id="login-form" onSubmit={handleSubmit}>
              {/* Email Input */}
              <Input
                label="Email Address" // Changed label to match HTML
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Email Address" // Changed placeholder to match HTML
                error={errors.email}
              />

              {/* Password Input with eye icon */}
              <div className="form-group"> {/* Outer div for the group, Input component handles the inner form-group */}
                <label className="form-label">Password</label>
                <div className="password-icon">
                  <Input
                    // We don't pass the label prop here as we rendered it above
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Password" // Changed placeholder to match HTML
                    className="" // Ensure no extra classes are passed from here to avoid conflict
                    error={errors.password}
                  />
                  <img
                    src={showPassword ? `/user/images/eye-show.svg` : `/user/images/eye-hide.svg`}
                    className="img-fluid"
                    alt="Toggle Password Visibility"
                    onClick={togglePasswordVisibility}
                    style={{ cursor: 'pointer' }} // Add a style for better UX
                  />
                </div>
              </div>

              {/* Forgot Password Link */}
              <div className="form-group forgotpassword">
                <Link to="/forgot-password">Forgot Password ?</Link>
              </div>

              {/* Login Button */}
              <div className="login-btn">
                <Button type="submit" className="btn btn-info"> {/* Apply Bootstrap classes */}
                  Log In
                </Button>
              </div>
            </form>
            <h5>
              Don't have an account ? <Link to="/signup">Sign Up</Link>
            </h5>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
};

export default Login;
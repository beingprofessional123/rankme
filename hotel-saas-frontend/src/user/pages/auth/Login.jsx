// src/pages/auth/Login.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import Input from '../../components/forms/Input';
import Button from '../../components/forms/Button';
import AuthLayout from '../../layouts/AuthLayout';

const Login = () => {
  const navigate = useNavigate();
  const [errors, setErrors] = useState({});

  const [showPassword, setShowPassword] = useState(false); // State for password visibility
  const [loading, setLoading] = useState(false);
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
      
        //fatching the user subscriptions
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

        //checking the user subscriptions
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
            // navigate('/subscription');
            navigate('/dashboard');
          }
        }

      } catch (error) {
        console.error('Error fetching subscription:', error);
        localStorage.removeItem('token'); // Clear token if validation fails
        localStorage.removeItem('user');
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

    setLoading(true);

      //login api
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_BASE_URL}/api/login`, {
        email,
        password,
      });

      const data = response.data;
      localStorage.setItem('token', data.token);
      const userWithCompanyId = {
        ...data.user,
        company_id: data.user.company?.id || null
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
        case 'company_admin':
          // window.location.href = '/subscription';
          window.location.href = '/dashboard';
          break;
        case 'revenue_manager':
        case 'general_manager':
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
    } finally {
      setLoading(false); // ⬅️ End loading state

    }
  };

  return (
    <AuthLayout>
      <div className="loginmain">
        <div className="logo">
          <Link href="#">
            <img
              src={`/user/images/logo.png`}
              className="img-fluid"
              alt="RankMeOne Logo"
            />
          </Link>
        </div>
        <div className="loginbg-w">
          <h1>Log in to your account</h1>
          {errors.general && (
            <div className="alert alert-danger text-danger small text-center mt-3">{errors.general}</div>
          )}
          <div className="form-design">
            <form id="login-form" onSubmit={handleSubmit}>
              <Input
                label="Email Address"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Email Address"
                error={errors.email}
              />

              <div className="form-group">
                <label className="form-label">Password</label>
                <div className="password-icon">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Password"
                    className=""
                    error={errors.password}
                  />
                  <img
                    src={showPassword ? `/user/images/eye-show.svg` : `/user/images/eye-hide.svg`}
                    className="img-fluid"
                    alt="Toggle Password Visibility"
                    onClick={togglePasswordVisibility}
                    style={{ cursor: 'pointer' }}
                  />
                </div>
              </div>

              <div className="form-group forgotpassword">
                <Link to="/forgot-password">Forgot Password ?</Link>
              </div>

              <div className="login-btn">

                <Button type="submit" className="btn btn-info" disabled={loading}>
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    </>
                  ) : (
                    'Log In'
                  )}
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
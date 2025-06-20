import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom'; // to redirect after login

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const location = useLocation();
  const logoutMessage = location.state?.message || null;

  const navigate = useNavigate(); // use this to redirect

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_BASE_URL}/api/login`,
        {
          email,
          password
        }
      );

      // Assuming response includes token or user data
      const { token, user } = response.data;
      localStorage.setItem('admin_token', token);
      localStorage.setItem('admin_user', JSON.stringify(user));

      // Redirect to dashboard or wherever
      navigate('/admin/dashboard');

    } catch (error) {
      console.error('Login error:', error);
      setErrorMsg(
        error.response?.data?.message || 'Login failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='form'>
      <div className="form-container adminlogin">
        <div className="container">
          <div className="row">
            <div className="col-md-6">
              <div className="form-form loginform">
                <div className="form-form-wrap">
                  <div className="form-container">
                    <div className="form-content">
                      <img
                        src={`/user/images/logo.png`}
                        className="logo"
                        alt="RankMeOne Logo"
                      />
                      <h1>Log In to <span className="brand-name">Admin</span></h1>
                      {errorMsg && <div className="alert alert-danger">{errorMsg}</div>}
                      {logoutMessage && (
                        <div className="alert alert-success text-center">
                          {logoutMessage}
                        </div>
                      )}

                      <form method="post" action="" className="text-left" onSubmit={handleLogin}>
                        <div className="form">
                          <div id="username-field" className="field-wrapper input">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                              viewBox="0 0 24 24" fill="none" stroke="currentColor"
                              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                              className="feather feather-user">
                              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                              <circle cx="12" cy="7" r="4" />
                            </svg>
                            <input
                              id="username"
                              name="username"
                              type="text"
                              className="form-control"
                              placeholder="Username"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                            />
                          </div>

                          <div id="password-field" className="field-wrapper input mb-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                              viewBox="0 0 24 24" fill="none" stroke="currentColor"
                              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                              className="feather feather-lock">
                              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                            </svg>
                            <input
                              id="password"
                              name="password"
                              type={showPassword ? 'text' : 'password'}
                              className="form-control"
                              placeholder="Password"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                            />
                          </div>

                          <div className="d-sm-flex justify-content-between">
                            <div className="field-wrapper toggle-pass">
                              <p className="d-inline-block">Show Password</p>
                              <label className="switch s-primary">
                                <input
                                  type="checkbox"
                                  id="toggle-password"
                                  className="d-none"
                                  checked={showPassword}
                                  onChange={() => setShowPassword(!showPassword)}
                                />
                                <span className="slider round"></span>
                              </label>
                            </div>
                            <div className="field-wrapper">
                              <button type="submit" className="btn btn-primary">
                                Log In
                              </button>
                            </div>
                          </div>
                        </div>
                      </form>

                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-md-6">
              <div className="loginimg">
                <img
                  src={`/user/images/loginimg.png`}
                  className="loginimg-img"
                  alt="Login Visual"
                />
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

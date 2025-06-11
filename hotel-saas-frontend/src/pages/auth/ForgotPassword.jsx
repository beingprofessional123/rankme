// src/pages/auth/ForgotPassword.jsx
import React, { useState, useEffect } from 'react';
import Input from '../../components/forms/Input';
import Button from '../../components/forms/Button';
import AuthLayout from '../../layouts/AuthLayout';
import logo from '../../assets/images/logo.png'; // Assuming logo.png is also used here
import { Link } from 'react-router-dom';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(''); // State for handling API errors

  // Effect to add/remove 'loginbg' class to the body
  useEffect(() => {
    document.body.classList.add('loginbg');
    return () => {
      document.body.classList.remove('loginbg');
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); // Clear previous errors

    if (!email) {
      setError('Email address is required.');
      return;
    }

    // TODO: Call forgot password API using axios, similar to Login.jsx
    try {
      // Example API call (replace with your actual endpoint)
      // const response = await axios.post(`${process.env.REACT_APP_API_BASE_URL}/api/forgot-password`, { email });
      // console.log(response.data); // Log response if needed
      setSubmitted(true);
    } catch (apiError) {
      console.error("Forgot password API error:", apiError);
      const message = apiError.response?.data?.message || 'Failed to send reset link. Please try again.';
      setError(message);
      setSubmitted(false); // If there's an error, don't show success message
    }
  };

  return (
    <AuthLayout>
      <div className="loginmain">
        <div className="logo">
          <a href="#"> {/* Consider using React Router Link if navigating internally */}
            <img src={logo} className="img-fluid" alt="RankMeOne Logo" />
          </a>
        </div>
        <div className="loginbg-w">
          <h1>Forgot Your Password</h1> {/* Changed to h1 as per HTML */}
          <div className="form-design">
            {submitted ? (
              <p className="text-green-600 text-center mb-4">
                A password reset link has been sent to your email.
              </p>
            ) : (
              <form onSubmit={handleSubmit}>
                {error && (
                  <div className="text-red-600 text-sm mb-2 text-center">{error}</div>
                )}
                <Input
                  label="Email Address" 
                  type="email"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email Address" 
                />
                <div className="login-btn">
                  <Button type="submit" className="btn btn-info"> {/* Apply Bootstrap classes */}
                    Send Reset Link
                  </Button>
                </div>
              </form>
            )}
            {/* You can add a "Back to Login" link if desired, similar to the HTML example */}
            <h5 className="mt-4">
              Remember your password? <Link to="/login">Log In</Link>
            </h5>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
};

export default ForgotPassword;
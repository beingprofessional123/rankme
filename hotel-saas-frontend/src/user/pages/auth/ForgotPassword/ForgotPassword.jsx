import React, { useState, useEffect } from 'react';
import Input from '../../../components/forms/Input';
import Button from '../../../components/forms/Button';
import AuthLayout from '../../../layouts/AuthLayout';
import { Link } from 'react-router-dom';
import axios from 'axios';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false); // Add loading state

  useEffect(() => {
    document.body.classList.add('loginbg');
    return () => {
      document.body.classList.remove('loginbg');
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitted(false);
    setLoading(true); // Start loading

    if (!email) {
      setError('Email address is required.');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_BASE_URL}/api/forgot-password`,
        { email }
      );
      setSubmitted(true);
    } catch (apiError) {
      console.error("Forgot password API error:", apiError);
      const message =
        apiError.response?.data?.message ||
        'Failed to send reset link. Please try again.';
      setError(message);
    } finally {
      setLoading(false); // Stop loading in both success and error
    }
  };

  return (
    <AuthLayout>
      <div className="loginmain">
        <div className="logo">
          <Link to="/">
            <img src={`/user/images/logo.png`} className="img-fluid" alt="RankMeOne Logo" />
          </Link>
        </div>
        <div className="loginbg-w">
          <h1>Forgot Your Password</h1>
          <div className="form-design">
            {error && (
              <div className="alert alert-danger text-center" role="alert">
                {error}
              </div>
            )}

            {submitted && (
              <div className="alert alert-success text-center" role="alert">
                A password reset link has been sent to your email.
              </div>
            )}

            {!submitted && (
              <form onSubmit={handleSubmit}>
                <Input
                  label="Email Address"
                  type="email"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email Address"
                />
                <div className="login-btn mt-3">
                  <Button type="submit" className="btn btn-info" disabled={loading}>
                    {loading ? (
                      <span>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Sending...
                      </span>
                    ) : (
                      'Send Reset Link'
                    )}
                  </Button>
                </div>
              </form>
            )}

            <h5 className="mt-4 text-center">
              Remember your password?{' '}
              <Link to="/login" className="text-blue-600 hover:underline">
                Log In
              </Link>
            </h5>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
};

export default ForgotPassword;

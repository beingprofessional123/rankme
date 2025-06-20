import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Input from '../../../components/forms/Input';
import Button from '../../../components/forms/Button';
import AuthLayout from '../../../layouts/AuthLayout';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const togglePasswordVisibility = () => setShowPassword(!showPassword);
  const toggleConfirmPasswordVisibility = () => setShowConfirmPassword(!showConfirmPassword);


  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!password || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${process.env.REACT_APP_API_BASE_URL}/api/reset-password`, {
        token,
        password,
      });
      if (res.status === 200) {
        setTimeout(() => {
          navigate('/password-reset-success');
        }, 3000);
      }
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message || 'Failed to reset password. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="loginmain">
        <div className="logo">
          <img src={`/user/images/logo.png`} alt="Logo" className="img-fluid" />
        </div>
        <div className="loginbg-w">
          <h1>Reset Your Password</h1>
          <div className="form-design">
            {error && (
              <div className="alert alert-danger text-center" role="alert">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">New Password</label>
                <div className="password-icon">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="New Password"
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

              <div className="form-group mt-3">
                <label className="form-label">Confirm Password</label>
                <div className="password-icon">
                  <Input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm Password"
                  />
                  <img
                    src={showConfirmPassword ? `/user/images/eye-show.svg` : `/user/images/eye-hide.svg`}
                    className="img-fluid"
                    alt="Toggle Password Visibility"
                    onClick={toggleConfirmPasswordVisibility}
                    style={{ cursor: 'pointer' }}
                  />
                </div>
              </div>

              <div className="login-btn mt-4">
                <Button type="submit" className="btn btn-info" disabled={loading}>
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" />
                      Resetting...
                    </>
                  ) : (
                    'Reset Password'
                  )}
                </Button>
              </div>
            </form>

          </div>
        </div>
      </div>
    </AuthLayout>
  );
};

export default ResetPassword;

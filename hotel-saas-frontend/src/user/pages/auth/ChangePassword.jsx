import React, { useState, useEffect } from 'react';
import axios from 'axios'; // Assuming you'll make an API call for password reset
import { useParams, useLocation } from 'react-router-dom'; // If using react-router-dom for token from URL
import { Link } from 'react-router-dom'; // Import Link

import Input from '../../components/forms/Input';
import Button from '../../components/forms/Button';
import AuthLayout from '../../layouts/AuthLayout';

const ChangePassword = () => {
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmNewPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [generalError, setGeneralError] = useState('');

  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // If your password reset token comes from the URL (e.g., /reset-password/:token)
  // const { token } = useParams();
  // Or if it's a query parameter (e.g., /reset-password?token=xyz)
  // const location = useLocation();
  // const queryParams = new URLSearchParams(location.search);
  // const token = queryParams.get('token');


  // Effect to add/remove 'loginbg' class to the body
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
    setSuccessMessage(''); // Clear success message on input change
  };

  const togglePasswordVisibility = (field) => {
    if (field === 'newPassword') {
      setShowNewPassword(!showNewPassword);
    } else if (field === 'confirmNewPassword') {
      setShowConfirmPassword(!showConfirmPassword);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { newPassword, confirmNewPassword } = formData;
    const newErrors = {};

    // Basic validation
    if (!newPassword) newErrors.newPassword = 'New password is required.';
    if (newPassword.length < 6) newErrors.newPassword = 'Password must be at least 6 characters.'; // Example length
    if (!confirmNewPassword) newErrors.confirmNewPassword = 'Confirm new password is required.';
    if (newPassword !== confirmNewPassword) newErrors.confirmNewPassword = 'Passwords do not match.';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({}); // Clear previous errors
    setGeneralError('');
    setSuccessMessage('');

    try {
      // TODO: Replace with your actual API endpoint and logic for changing password
      // You'll likely need to send the token obtained from the URL as well.
      // const response = await axios.post(`${process.env.REACT_APP_API_BASE_URL}/api/reset-password`, {
      //   token: token, // Make sure you parse the token from the URL as shown in comments above
      //   password: newPassword,
      //   password_confirmation: confirmNewPassword,
      // });

      // Simulate API success
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Password reset successfully!'); // Log success

      setSuccessMessage('Your password has been successfully reset. You can now log in.');
      setFormData({ newPassword: '', confirmNewPassword: '' }); // Clear form

      // Optional: Redirect to login page after a short delay
      // setTimeout(() => {
      //   window.location.href = '/login';
      // }, 3000);

    } catch (error) {
      console.error('Password reset failed:', error);
      const message = error.response?.data?.message || 'Failed to reset password. Please try again.';
      setGeneralError(message);
    }
  };

  return (
    <AuthLayout>
      <div className="loginmain">
        <div className="logo">
          <Link to=''>
            <img src={`/user/images/logo.png`} className="img-fluid" alt="RankMeOne Logo" />
          </Link>
        </div>
        <div className="loginbg-w">
          <h1>Create a New Password</h1>
          <div className="form-design">
            <form onSubmit={handleSubmit}>
              {generalError && (
                <div className="text-red-600 text-sm mb-2 text-center">{generalError}</div>
              )}
              {successMessage && (
                <div className="text-green-600 text-sm mb-4 text-center">{successMessage}</div>
              )}

              {/* Set New Password */}
              <div className="form-group">
                <label className="form-label">Set New Password</label>
                <div className="password-icon">
                  <Input
                    type={showNewPassword ? 'text' : 'password'}
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleChange}
                    placeholder="Set new password"
                    className="" // Ensure no extra classes are passed
                  />
                  <img
                    src={showNewPassword ? `/user/images/eye-show.svg` : `/user/images/eye-hide.svg`}
                    className="img-fluid"
                    alt="Toggle New Password Visibility"
                    onClick={() => togglePasswordVisibility('newPassword')}
                    style={{ cursor: 'pointer' }}
                  />
                </div>
                {errors.newPassword && <div className="text-red-600 text-sm mt-1">{errors.newPassword}</div>}
              </div>

              {/* Confirm New Password */}
              <div className="form-group">
                <label className="form-label">Confirm New Password</label>
                <div className="password-icon">
                  <Input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmNewPassword"
                    value={formData.confirmNewPassword}
                    onChange={handleChange}
                    placeholder="Confirm new password"
                    className="" // Ensure no extra classes are passed
                  />
                  <img
                    src={showConfirmPassword ? `/user/images/eye-show.svg` : `/user/images/eye-hide.svg`}
                    className="img-fluid"
                    alt="Toggle Confirm Password Visibility"
                    onClick={() => togglePasswordVisibility('confirmNewPassword')}
                    style={{ cursor: 'pointer' }}
                  />
                </div>
                {errors.confirmNewPassword && <div className="text-red-600 text-sm mt-1">{errors.confirmNewPassword}</div>}
              </div>

              <div className="login-btn">
                <Button type="submit" className="btn btn-info">
                  Reset Password
                </Button>
              </div>
            </form>
            {/* Optional: Back to login link */}
            <h5 className="mt-4">
              <Link to="/login">Back to Login</Link>
            </h5>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
};

export default ChangePassword;
// src/pages/auth/PasswordResetSuccess.jsx
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // For programmatic navigation

import AuthLayout from '../../layouts/AuthLayout';
import Button from '../../components/forms/Button';
import logo from '../../assets/images/logo.png'; // Path to your logo image
import successfullyIcon from '../../assets/images/successfully.svg'; // Path to your successfully.svg icon

const PasswordResetSuccess = () => {
  const navigate = useNavigate();

  // Effect to add/remove 'loginbg' class to the body
  useEffect(() => {
    document.body.classList.add('loginbg');
    return () => {
      document.body.classList.remove('loginbg');
    };
  }, []);

  const handleContinue = () => {
    // Redirect to the login page after successful password reset
    navigate('/login');
  };

  return (
    <AuthLayout>
      <div className="loginmain">
        <div className="logo">
          <a href="#"> {/* Consider using React Router Link if navigating internally */}
            <img src={logo} className="img-fluid" alt="RankMeOne Logo" />
          </a>
        </div>
        <div className="loginbg-w reset-successfully"> {/* Added reset-successfully class as per HTML */}
          <img src={successfullyIcon} className="img-fluid" alt="Successfully Reset" />
          <h1>Password reset!</h1>
          <p>
            Your password has been successfully reset. <br />Click below to log in magically.
          </p>
          <div className="login-btn">
            <Button type="button" onClick={handleContinue} className="btn btn-info"> {/* Apply Bootstrap classes */}
              Continue
            </Button>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
};

export default PasswordResetSuccess;
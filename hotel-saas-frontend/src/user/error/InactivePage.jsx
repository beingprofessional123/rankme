import React, { useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';

const InactivePage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const status = queryParams.get('status'); // Will be "true" if present

  // Redirect if status param is not present or not "true"
  useEffect(() => {
    if (status !== 'true') {
      navigate('/login');
    }
  }, [status, navigate]);

  return (
    <div className="loginmain">
      <div className="logo">
        <a href="#">
          <img
            src={`/user/images/logo.png`}
            className="img-fluid"
            alt="RankMeOne Logo"
          />
        </a>
      </div>

      <div className="loginbg-w">
        <h1>Account Inactive</h1>

        <div className="form-design">
          <p style={{ textAlign: 'center', marginBottom: '1rem' }}>
            Your account has been marked as inactive. Please contact support or your admin.
          </p>

          <div className="login-btn">
            <Link to="/login" className="btn btn-info">Go to Login</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InactivePage;

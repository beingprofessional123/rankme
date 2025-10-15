import React, { useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';

const AccessDeniedPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const reason = queryParams.get('reason');

  useEffect(() => {
    if (reason !== 'denied') {
      navigate('/login', { replace: true });
    }
  }, [reason, navigate]);

  // Always redirect to a safe default
  const fallbackPath = '/dashboard';

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
        <h1>Permission Denied</h1>
        <p style={{ textAlign: 'center', marginBottom: '1rem' }}>
          You do not have the necessary permissions to access this page. <br />
          Please contact your administrator.
        </p>
        <div className="login-btn">
          <Link to={fallbackPath} className="btn btn-info">
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AccessDeniedPage;

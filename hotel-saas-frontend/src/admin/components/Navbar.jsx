import { Link, useNavigate } from "react-router-dom";

const Navbar = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('admin_user') || '{}');
  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    navigate('/admin/login', { state: { message: 'Logged out successfully.' } });
  };

  return (
    <>
      <div className="header-container fixed-top">
        <header className="header navbar navbar-expand-sm">
          <ul className="navbar-item flex-row">
            <li className="nav-item theme-logo">
              <Link href="javascript:void(0);" onClick="window.location.reload();">
                <img src={`/user/images/logo.png`} className="navbar-logo" alt="logo-static" />
              </Link>
            </li>
          </ul>

          <Link href="javascript:void(0);" data-click="1" className="sidebarCollapse sidebar_collapse_btn" id="navbtn" data-placement="bottom"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-list"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3" y2="6"></line><line x1="3" y1="12" x2="3" y2="12"></line><line x1="3" y1="18" x2="3" y2="18"></line></svg></Link>

          <ul className="navbar-item flex-row search-ul">

          </ul>
          <ul className="navbar-item flex-row navbar-dropdown">


            <li className="nav-item dropdown user-profile-dropdown  order-lg-0 order-1">
              <Link href="javascript:void(0);" className="nav-link dropdown-toggle user" id="userProfileDropdown" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                <img src={`/admin/assets/img/90x90.jpg`} alt="admin-profile" className="img-fluid" />
              </Link>
              <div className="dropdown-menu position-absolute animated fadeInUp" aria-labelledby="userProfileDropdown">
                <div className="user-profile-section">
                  <div className="media mx-auto">
                    <img src={`/admin/assets/img/90x90.jpg`} className="img-fluid mr-2" alt="avatar" />
                    <div className="media-body">
                      <h5>{user.name || 'Admin'}</h5>
                      <p>{user.role || 'Admin'}</p>
                    </div>
                  </div>
                </div>
                <div className="dropdown-item">
                  <Link to=''>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-user"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg> <span>My Profile</span>
                  </Link>
                </div>
                <div className="dropdown-item">
                  <Link to=''>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"> <path d="M336 352c97.2 0 176-78.8 176-176S433.2 0 336 0S160 78.8 160 176c0 18.7 2.9 36.8 8.3 53.7L7 391c-4.5 4.5-7 10.6-7 17v80c0 13.3 10.7 24 24 24h80c13.3 0 24-10.7 24-24V448h40c13.3 0 24-10.7 24-24V384h40c6.4 0 12.5-2.5 17-7l33.3-33.3c16.9 5.4 35 8.3 53.7 8.3zM376 96a40 40 0 1 1 0 80 40 40 0 1 1 0-80z" /></svg>
                    <span>Change Password</span>
                  </Link>
                </div>
                <div className="dropdown-item">
                   <Link to="#" onClick={(e) => { e.preventDefault(); handleLogout();}}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-log-out"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg> <span>Log Out</span>
                  </Link>
                </div>
              </div>
            </li>
          </ul>
        </header>
      </div>
    </>
  );
};

export default Navbar;

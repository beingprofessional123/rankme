// src/components/DashboardLayout.jsx
import React from 'react';
import Sidebar from './Sidebar';
import Header from './DashboardHeader';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const DashboardLayout = ({ children }) => {
  const user = JSON.parse(localStorage.getItem('user')) || { name: 'Guest' }; // Ensure 'name' is used
  const username = user.name;
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
  const currentYear = new Date().getFullYear();

  let image = null;
  if (user.role === 'company_admin') {
    image = user.company?.logo_url ? user.company.logo_url : null;
  } else {
    image = user.profile_image ? user.profile_image : null;
  }
  return (
    // The top-level div corresponding to your <body> with class "d-body"
    <div className="d-body">
      <Sidebar />
      <Header username={username} image={image} />

      {/* Main Content Area */}
      {/* This corresponds to the content area that's not the sidebar or topbar */}
      <main className="main-content-area">
        {children}
      </main>

      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
      <div className="dashboard-footer">
        <div className="container-fluid">
          <div className="row">
            <div className="col-md-6">
              <div className="copyright-left">
              <p>Copyright © {currentYear} <a href="#">RankMeOne.ai</a> - All Rights Reserved.</p>
              </div>
            </div>
            <div className="col-md-6">
              <div className="copyright-right">
                <ul>
                  <li><a href="#">Terms of Use</a></li>
                  <li><a href="#">Privacy Policy</a></li>
                </ul>         
              </div>
            </div>
          </div>
        </div>
      </div>


    </div>
  );
};

export default DashboardLayout;
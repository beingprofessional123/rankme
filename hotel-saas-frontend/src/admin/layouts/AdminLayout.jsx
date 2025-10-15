import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Sidebar from '../components/Sidebar';
import { Outlet } from 'react-router-dom';


const AdminLayout = ({ children }) => {
  return (
    <div className="dashboard-analytics">
      <Navbar />

      <div className="main-container" id="container">
        <div className="overlay"></div>
        <div className="search-overlay"></div>

        <Sidebar />
        <div id="content" className="main-content">
           {children} {/* Will render nested route content */}
       
        <Footer />  
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
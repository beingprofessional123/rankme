import React, { useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { Link, useLocation } from 'react-router-dom';

const UserRoleManagementEditPage = () => {
  const location = useLocation();
  const user = location.state?.data;

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    role: user?.role || '',
  });

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Updated user data:', formData);
    // TODO: Send formData to API to update the user
  };

  return (
    <DashboardLayout>
      <div className="mainbody">
        <div className="container-fluid">

          <div className="row breadcrumbrow">
            <div className="col-md-12">
              <div className="breadcrumb-sec">
                <h2>User Edit</h2>
                <nav aria-label="breadcrumb">
                  <ol className="breadcrumb">
                    <li className="breadcrumb-item">
                      <Link to="/user-role-management">Home</Link>
                    </li>
                    <li className="breadcrumb-item active" aria-current="page">
                      User Edit
                    </li>
                  </ol>
                </nav>
              </div>
            </div>
          </div>

          <div className="white-bg">
            <div className="form-design">
              <form onSubmit={handleSubmit}>
                <div className="row">
                  <div className="col-md-6">
                    <div className="form-group">
                      <label className="form-label">Full Name</label>
                      <input
                        type="text"
                        className="form-control"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Full Name"
                      />
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="form-group">
                      <label className="form-label">Email Address</label>
                      <input
                        type="email"
                        className="form-control"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Email Address"
                      />
                    </div>
                  </div>

                  <div className="col-md-12">
                    <div className="form-group">
                      <label className="form-label">Select Role</label>
                      <select
                        name="role"
                        className="form-select form-control"
                        value={formData.role}
                        onChange={handleChange}
                      >
                        <option value="">Select Role</option>
                        <option value="Revenue Manager">Revenue Manager</option>
                        <option value="General Manager">General Manager</option>
                        <option value="Analyst/Viewer">Analyst/Viewer</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="addentry-btn">
                  <button type="submit" className="btn btn-info">Submit</button>
                </div>
              </form>
            </div>
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
};

export default UserRoleManagementEditPage;

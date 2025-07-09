import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const UserManagementView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await axios.get(
        `${process.env.REACT_APP_API_BASE_URL}/api/admin/user-management/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setUser(response.data.results);
    } catch (error) {
      console.error('Error fetching user:', error);
      toast.error('Failed to fetch user details');
    }
  };

  if (!user) {
    return <div className="text-center my-5">Loading user details...</div>;
  }

  return (
    <div id="content" className="main-content">
      <div className="layout-px-spacing">
        <div className="page-header d-flex justify-content-between">
          <div className="page-title">
            <h3>View User</h3>
          </div>
          <Link className="btn btn-primary" to="/admin/user-management">Back</Link>
        </div>

        <div className="row layout-top-spacing">
          <div className="col-xl-12 layout-spacing">
            <div className="user-profile layout-spacing user-managementview">
              <div className="widget-content widget-content-area">
                <div className="d-flex justify-content-between">
                  <h3>User Information</h3>
                  <Link to={`/admin/user-management/${user.id}/edit`} className="edit-profile">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                      viewBox="0 0 24 24" fill="none" stroke="currentColor"
                      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                      className="feather feather-edit-3">
                      <path d="M12 20h9"></path>
                      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                    </svg>
                  </Link>
                </div>

                <div className="text-center user-info">
                  <img
                    src={user.profile || '/admin/assets/img/90x90.jpg'}
                    alt="profile"
                    className="rounded-circle mb-3"
                    width="90"
                    height="90"
                  />
                  <p><b>{user.name}</b></p>
                </div>

                <div className="user-info-list">
                  <ul className="contacts-block list-unstyled">
                    <li><strong>Company:</strong> {user.Company?.name || 'N/A'}</li>
                    <li><strong>Email:</strong> {user.email}</li>
                    <li>
                      <strong>Phone:</strong>{' '}
                      {user.Country?.phonecode ? `${user.Country.phonecode} ` : ''}
                      {user.phone || 'N/A'}
                    </li>
                     <li><strong>Role:</strong> 
                      {user.Role?.name?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'N/A'}
                    </li>
                    <li><strong>Status:</strong> 
                      {user.is_active
                        ? <span className="badge bg-success ml-2">Active</span>
                        : <span className="badge bg-danger ml-2">Inactive</span>}
                    </li>
                    <li><strong>Created At:</strong> {new Date(user.createdAt).toLocaleString()}</li>
                    <li><strong>Updated At:</strong> {new Date(user.updatedAt).toLocaleString()}</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>  
    </div>
  );
};

export default UserManagementView;

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
      toast.success('User details fetched successfully!');
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
            <h3>View</h3>
          </div>
          <div className="page-title">
            <Link className="btn btn-primary" to="/admin/user-management">Back</Link>
          </div>
        </div>

        <div className="row layout-top-spacing">
          <div className="col-xl-12 layout-spacing">
            <div className="user-profile layout-spacing user-managementview">
              <div className="widget-content widget-content-area">
                <div className="d-flex justify-content-between">
                  <h3>Information</h3>
                  <Link to={`/admin/user-management/${user.id}/edit`} className="mt-2 edit-profile">
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
                    src={user.profile ? `${user.profile}` : '/admin/assets/img/90x90.jpg'}
                    alt="profile"
                    className="rounded-circle mb-3"
                    width="90"
                    height="115"
                  />
                  <p><b>{user.first_name} {user.last_name}</b></p>
                </div>

                <div className="user-info-list">
                  <ul className="contacts-block list-unstyled">
                    <li><strong>Email:</strong> {user.email}</li>
                    <li><strong>Phone:</strong> {user.phone || 'N/A'}</li>
                    <li><strong>Status:</strong> {user.status === '1'
                      ? <span className="badge bg-success">Active</span>
                      : <span className="badge bg-danger">Inactive</span>}</li>
                    <li><strong>Role:</strong> {user.role}</li>
                    <li><strong>Company:</strong> {user.company_name || user.company_id || 'N/A'}</li>
                    <li><strong>Reset Token:</strong> {user.reset_password_token || 'N/A'}</li>
                    <li><strong>Reset Expiry:</strong> {user.reset_password_expires || 'N/A'}</li>
                    <li><strong>Created At:</strong> {new Date(user.created_at).toLocaleString()}</li>
                    <li><strong>Updated At:</strong> {user.updated_at ? new Date(user.updated_at).toLocaleString() : 'N/A'}</li>
                    <li><strong>User ID:</strong> {user.id}</li>
                  </ul>
                </div>

                <div className="mt-4">
                  <button onClick={() => navigate('/admin/user-management')} className="btn btn-secondary">
                    Back to List
                  </button>
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

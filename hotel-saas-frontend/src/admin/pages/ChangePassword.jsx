import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const ChangePassword = () => {
  const [form, setForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [loading, setLoading] = useState(false);
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { oldPassword, newPassword, confirmPassword } = form;

    if (!oldPassword || !newPassword || !confirmPassword) {
      return toast.error('All fields are required');
    }

    if (newPassword !== confirmPassword) {
      return toast.error('New password and confirm password do not match');
    }

    setLoading(true);
    const token = localStorage.getItem('admin_token');

    try {
      const response = await axios.put(
        `${process.env.REACT_APP_API_BASE_URL}/api/admin/change-password`,
        { oldPassword, newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.status === 'success') {
        toast.success(response.data.message || 'Password changed successfully');
        setForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        toast.error(response.data.message || 'Failed to change password');
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Server error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="layout-px-spacing mt-4">
      <div className="page-header mb-4">
        <h3>Change Password</h3>
      </div>

      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card shadow-sm p-4">
            <h5 className="card-title mb-4">Update Your Password</h5>
            <form onSubmit={handleSubmit}>

              {/* Old Password */}
              <div className="form-group mb-3">
                <label htmlFor="oldPassword">Old Password</label>
                <div className="input-group">
                  <input
                    type={showOld ? 'text' : 'password'}
                    id="oldPassword"
                    name="oldPassword"
                    className="form-control"
                    value={form.oldPassword}
                    onChange={handleChange}
                    required
                  />
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setShowOld(prev => !prev)}
                  >
                    {showOld ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div className="form-group mb-3">
                <label htmlFor="newPassword">New Password</label>
                <div className="input-group">
                  <input
                    type={showNew ? 'text' : 'password'}
                    id="newPassword"
                    name="newPassword"
                    className="form-control"
                    value={form.newPassword}
                    onChange={handleChange}
                    required
                  />
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setShowNew(prev => !prev)}
                  >
                    {showNew ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div className="form-group mb-4">
                <label htmlFor="confirmPassword">Confirm New Password</label>
                <div className="input-group">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    id="confirmPassword"
                    name="confirmPassword"
                    className="form-control"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    required
                  />
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setShowConfirm(prev => !prev)}
                  >
                    {showConfirm ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary w-100"
                disabled={loading}
              >
                {loading ? 'Updating...' : 'Change Password'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChangePassword;

import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import MUIDataTable from 'mui-datatables';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const UserRoleManagementPage = () => {
    const [tableData, setTableData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedUserToDelete, setSelectedUserToDelete] = useState(null);

    const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

    const getAuthToken = () => localStorage.getItem('token');

    const fetchUsers = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = getAuthToken();
            if (!token) {
                setError('Authentication token not found. Please log in.');
                toast.error('You are not authenticated. Please log in.', {
                    toastId: 'authError',
                    onClick: () => toast.dismiss('authError')
                });
                return;
            }

            const response = await axios.get(`${API_BASE_URL}/api/users/list`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            setTableData(response.data.users);

        } catch (err) {
            console.error('Error fetching users:', err);
            const errorMessage = err.response?.data?.message || 'Failed to fetch users. Please try again later.';
            setError(errorMessage);
            toast.error(errorMessage, {
                toastId: 'fetchError',
                onClick: () => toast.dismiss('fetchError')
            });
        } finally {
            setLoading(false);
        }
    };

    const formatRoleName = (roleName) => {
        if (!roleName) return '';
        return String(roleName)
            .replace(/_/g, ' ')
            .replace(/\b\w/g, char => char.toUpperCase());
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleDelete = (user) => {
        setSelectedUserToDelete(user);
    };

    const confirmDelete = async () => {
        if (!selectedUserToDelete) return;

        try {
            const token = getAuthToken();
            if (!token) {
                toast.error('Authentication token not found. Please log in.', {
                    toastId: 'authErrorDelete',
                    onClick: () => toast.dismiss('authErrorDelete')
                });
                return;
            }

            const response = await axios.delete(`${API_BASE_URL}/api/users/${selectedUserToDelete.id}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            setTableData(prev => prev.filter(u => u.id !== selectedUserToDelete.id));
            toast.success(response.data.message || "User deleted successfully!", {
                toastId: 'deleteSuccess',
                onClick: () => toast.dismiss('deleteSuccess')
            });
        } catch (err) {
            console.error('Error deleting user:', err);
            const errorMessage = err.response?.data?.message || 'Failed to delete user. Please try again.';
            toast.error(errorMessage, {
                toastId: 'deleteError',
                onClick: () => toast.dismiss('deleteError')
            });
        } finally {
            setSelectedUserToDelete(null);
        }
    };

    const columns = [
        { name: 'name', label: 'Name' },
        { name: 'email', label: 'Email Address' },
        { name: 'phone', label: 'Phone', options: { customBodyRender: (value) => value || 'N/A' } },
        {
            name: 'role_name',
            label: 'Role',
            options: {
                customBodyRender: (value) => formatRoleName(value)
            }
        },
        {
            name: 'is_active',
            label: 'Status',
            options: {
                customBodyRender: (value) => (
                    <span className={`status-design ${value ? 'status-g' : 'status-r'}`}>
                        {value ? 'Active' : 'Inactive'}
                    </span>
                )
            }
        },
        {
            name: 'id',
            label: 'Action',
            options: {
                filter: false,
                sort: false,
                empty: true,
                customBodyRender: (value, tableMeta) => {
                    const rowIndex = tableMeta.rowIndex;
                    const user = tableData[rowIndex];
                    return (
                        <div className="tdaction">
                            <Link to={`/user-role-management-edit/${value}`} state={{ user: user }}>
                                <img src={`/user/images/edit.svg`} className="img-fluid" alt="edit" />
                            </Link>
                            <a
                                href="#!"
                                data-bs-toggle="modal"
                                data-bs-target="#mydeleteuserModal"
                                onClick={() => handleDelete(user)}
                            >
                                <img src={`/user/images/deletetd.svg`} className="img-fluid" alt="delete" />
                            </a>
                        </div>
                    );
                }
            }
        }
    ];

    const options = {
        selectableRows: 'none',
        search: true,
        download: true,
        print: false,
        viewColumns: true,
        filter: true,
        responsive: 'standard',
        pagination: true,
        textLabels: {
            body: {
                noMatch: loading ? 'Loading Data...' : error ? `Error: ${error}` : 'Sorry, no matching records found',
            }
        }
    };

    return (
        <DashboardLayout>
            <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} newestOnTop={false}
                            closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />

            <div className="mainbody">
                <div className="container-fluid">

                    <div className="row breadcrumbrow">
                        <div className="col-md-6">
                            <div className="breadcrumb-sec">
                                <h2>User Role Management</h2>
                                <nav aria-label="breadcrumb">
                                    <ol className="breadcrumb">
                                        <li className="breadcrumb-item"><Link to="/user-role-management">Home</Link></li>
                                        <li className="breadcrumb-item active" aria-current="page">User Role Management</li>
                                    </ol>
                                </nav>
                            </div>
                        </div>
                        <div className="col-md-6">
                            <div className="breadcrumb-right">
                                <Link to="/user-role-management-add" className="btn btn-info">
                                    <img src={`/user/images/add.svg`} className="img-fluid" alt="Add User" /> User
                                </Link>
                            </div>
                        </div>
                    </div>

                    {loading ? (
                        <p>Loading users...</p>
                    ) : error ? (
                        <p style={{ color: 'red' }}>Error: {error}</p>
                    ) : (
                        <MUIDataTable
                            title="User Role Management"
                            data={tableData}
                            columns={columns}
                            options={options}
                        />
                    )}
                </div>
            </div>

            <div className="modal fade modaldesign data-failed" id="mydeleteuserModal" tabIndex="-1" aria-labelledby="deleteUserModalLabel" aria-hidden="true">
                <div className="modal-dialog">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h4 className="modal-title" id="deleteUserModalLabel">Delete Confirmation</h4>
                            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div className="modal-body">
                            <div className="form-design text-center">
                                <img src={`/user/images/failed.svg`} className="img-fluid mb-3" alt="Failed icon" />
                                <h3>Delete User</h3>
                                <p>Are you sure you want to delete <strong>{selectedUserToDelete?.name}</strong>?</p>
                                <div className="form-group float-end">
                                    <button
                                        type="button"
                                        className="btn btn-info cancelbtn"
                                        onClick={confirmDelete}
                                        data-bs-dismiss="modal"
                                    >
                                        Confirm Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default UserRoleManagementPage;

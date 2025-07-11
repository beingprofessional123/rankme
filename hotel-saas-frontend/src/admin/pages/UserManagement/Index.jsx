import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import MUIDataTable from 'mui-datatables';
import { IconButton, Tooltip } from '@mui/material';
import { Visibility, Edit, Delete } from '@mui/icons-material';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';

const UserManagementIndex = () => {
    const [users, setUsers] = useState([]);
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const token = localStorage.getItem('admin_token');

            const response = await axios.get(
                `${process.env.REACT_APP_API_BASE_URL}/api/admin/user-management-list`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            setUsers(response.data.results || []);
        } catch (error) {
            console.error('Error fetching users:', error);
            toast.error('Failed to fetch users');
        }
    };

    const deleteUser = async (id) => {
        const confirm = await Swal.fire({
            title: 'Are you sure?',
            text: 'This action will permanently delete the user.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!',
        });

        if (confirm.isConfirmed) {
            try {
                const token = localStorage.getItem('admin_token');
                const response = await axios.delete(
                    `${process.env.REACT_APP_API_BASE_URL}/api/admin/user-management/${id}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                if (response.data.status_code === 200) {
                    toast.success(response.data.message);
                    fetchUsers(); // refresh list only after successful deletion
                } else {
                    toast.error(response.data.message || 'Something went wrong.');
                }
            } catch (error) {
                console.error('Error deleting user:', error);
                const message =
                    error?.response?.data?.message ||
                    'An unexpected error occurred while deleting the user.';
                toast.error(message);
            }
        }
    };


    const columns = [
        {
            name: 'name',
            label: 'Name',
            options: {
                customBodyRenderLite: (dataIndex) => {
                    const user = users[dataIndex];
                    return (
                        <div className="d-flex align-items-center">
                            <img
                                width="40"
                                height="40"
                                className="rounded-circle me-2"
                                src={user.profile ? `${user.profile}` : '/admin/assets/img/90x90.jpg'}
                                alt="avatar"
                            />
                            <div className='m-1'>
                                <div><b>{user.first_name} {user.last_name}</b></div>
                                <div className="text-muted" style={{ fontSize: '0.875rem' }}>{user.email}</div>
                            </div>
                        </div>

                    );
                },
            },
        },
       {
  name: 'Phone',
  label: 'Phone',
  options: {
    customBodyRenderLite: (dataIndex) => {
      const user = users[dataIndex];
      const phoneCode = user.Country?.phonecode || '';
      const phone = user.phone || '';
      return `${phoneCode} ${phone}`.trim();
    },
  },
},
        {
            name: 'status',
            label: 'Status',
            options: {
                customBodyRenderLite: (dataIndex) => {
                    const status = users[dataIndex].status;
                    return (
                        <span className={`badge ${status === '1' ? 'bg-success' : 'bg-danger'}`}>
                            {status === '1' ? 'Active' : 'Inactive'}
                        </span>
                    );
                },
            },
        },
        {
            name: 'created_at',
            label: 'Created',
            options: {
                customBodyRenderLite: (dataIndex) =>
                    new Date(users[dataIndex].created_at).toLocaleDateString(),
            },
        },
        {
            name: 'actions',
            label: 'Actions',
            options: {
                customBodyRenderLite: (dataIndex) => {
                    const user = users[dataIndex];
                    return (
                        <>
                            <Tooltip title="View">
                                <IconButton
                                    component={Link}
                                    to={`/admin/user-management/${user.id}`}
                                    size="small"
                                    color="primary"
                                >
                                    <Visibility />
                                </IconButton>
                            </Tooltip>
                            <Tooltip title="Edit">
                                <IconButton
                                    component={Link}
                                    to={`/admin/user-management/${user.id}/edit`}
                                    size="small"
                                    color="warning"
                                >
                                    <Edit />
                                </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                                <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => deleteUser(user.id)}
                                >
                                    <Delete />
                                </IconButton>
                            </Tooltip>
                        </>
                    );
                },
            },
        },
    ];

    const options = {
        selectableRows: 'none',
        search: true,
        download: true,
        print: false,
        viewColumns: true,
        filter: true,
        pagination: true,
        responsive: 'standard',
        rowsPerPage: 10,
        rowsPerPageOptions: [10, 25, 50, 100],
    };

    return (
        <div>
            <div className="layout-px-spacing">
                <div className="page-header d-flex justify-content-between">
                    <div className="page-title">
                        <h3>User Management</h3>
                    </div>
                    <div className="page-title page-btn">
                        <Link className="btn btn-primary" to="/admin/user-management/create">Create</Link>
                    </div>
                </div>
                {successMessage && (
                    <div className="alert alert-success text-center text-uppercase my-2">
                        {successMessage}
                    </div>
                )}
                <div className="row layout-top-spacing" id="cancel-row">
                    <div className="col-xl-12 col-lg-12 col-sm-12 layout-spacing">
                        <div className="widget-content widget-content-area br-6">
                            <div className="table-responsive mb-4">
                                <MUIDataTable
                                    title="User List"
                                    data={users}
                                    columns={columns}
                                    options={options}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserManagementIndex;

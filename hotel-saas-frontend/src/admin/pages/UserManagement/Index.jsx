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
    const [loading, setLoading] = useState(true);
    const [totalUsers, setTotalUsers] = useState(0);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [searchText, setSearchText] = useState('');

    useEffect(() => {
        fetchUsers();
    }, [page, rowsPerPage, searchText]);

    const fetchUsers = async () => {
        setLoading(true); // 1️⃣ Set loading to true at the start of the fetch
        try {
            const token = localStorage.getItem('admin_token');

            const params = new URLSearchParams();
            params.append('search', searchText);
            params.append('page', page + 1);
            params.append('limit', rowsPerPage); 

            const response = await axios.get(
                `${process.env.REACT_APP_API_BASE_URL}/api/admin/user-management-list?${params.toString()}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            setUsers(response.data.results || []);
            setTotalUsers(response.data.total_count);
        } catch (error) {
            console.error('Error fetching users:', error);
            toast.error('Failed to fetch users');
        } finally {
            setLoading(false); // 2️⃣ Set loading to false in the finally block
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
                    fetchUsers();
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
        name: 'first_name',
        label: 'Name',
        options: {
            filter: false,
            sort: false,
            customBodyRenderLite: (dataIndex) => {
            const user = users[dataIndex];
            return (
                <div className="d-flex align-items-center">
                <img
                    width="40"
                    height="40"
                    className="rounded-circle me-2"
                    src={
                    user.company_image
                        ? `${process.env.REACT_APP_API_BASE_URL}/${user.company_image}`
                        : user.profile || '/admin/assets/img/90x90.jpg'
                    }
                    alt="avatar"
                />
                <div className="m-1">
                    <div><b>{user.first_name} {user.last_name}</b></div>
                    <div className="text-muted" style={{ fontSize: '0.875rem' }}>{user.email}</div>
                </div>
                </div>
            );
            },
            customDownload: (value, meta) => {
            const user = users[meta.rowIndex];
            return `${user.first_name} ${user.last_name} (${user.email})`;
            },
        },
    },
    {
        name: 'subscription_name',
        label: 'Plan',
        options: {
            sort: true,
            customBodyRender: (value) => {
                return value;
            },
        },
    },
    {
        name: 'phone',
        label: 'Phone',
        options: {
            sort: true,
            customBodyRender: (value) => {
                return value;
            },
        },
    },
    {
        name: 'status',
        label: 'Status',
        options: {
            filter: true,
            sort: true,
            customBodyRender: (value) => {
                const isActive = value === '1';
                return (
                    <span className={`badge ${isActive ? 'bg-success' : 'bg-danger'}`}>
                        {isActive ? 'Active' : 'Inactive'}
                    </span>
                );
            },
            download: {
                custom: (value) => {
                    return value === '1' ? 'Active' : 'Inactive';
                },
            },
        },
    },
    {
        name: 'created_at',
        label: 'Created At',
        options: {
            filter: true,
            sort: true,
            customBodyRender: (value) =>
                value ? new Date(value).toLocaleDateString() : 'N/A',
            download: {
                custom: (value) => {
                    return value ? new Date(value).toLocaleDateString() : 'N/A';
                },
            },
        },
    },
    {
        name: 'actions',
        label: 'Actions',
        options: {
            filter: true,
            sort: true,
            download: false,
            customBodyRender: (value, tableMeta) => {
                const user = users[tableMeta.rowIndex];
                return (
                    <>
                        <Tooltip title="View">
                            <IconButton component={Link} to={`/admin/user-management/${user.id}`} size="small">
                                <Visibility />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                            <IconButton component={Link} to={`/admin/user-management/${user.id}/edit`} size="small">
                                <Edit />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                            <IconButton size="small" color="error" onClick={() => deleteUser(user.id)}>
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
        serverSide: true,
        selectableRows: 'none',
        search: true,
        download: true,
        print: false,
        viewColumns: true,
        filter: true,
        pagination: true,
        responsive: 'standard',
        page: page,
        rowsPerPage: rowsPerPage,
        rowsPerPageOptions: [10, 25, 50, 100],
        count: totalUsers,
        onTableChange: (action, tableState) => {
            if (action === 'changePage') {
                setPage(tableState.page);
            } else if (action === 'changeRowsPerPage') {
                setRowsPerPage(tableState.rowsPerPage);
                setPage(0);
            } else if (action === 'search') {
                // 3️⃣ When a user searches, update the state
                setSearchText(tableState.searchText || '');
            }
        },
        textLabels: {
            body: {
                noMatch: loading ? 'Loading...' : 'Sorry, no matching records found', // 4️⃣ Conditional text for loading
            },
        },
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
                <div className="row layout-top-spacing" id="cancel-row">
                    <div className="col-xl-12 col-lg-12 col-sm-12 layout-spacing">
                        <div className="widget-content widget-content-area br-6">
                            <div className="tabledesign">
                                <div className="table-responsive">
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
        </div>
    );
};

export default UserManagementIndex;
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
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [totalUsers, setTotalUsers] = useState(0);
    const [plans, setPlans] = useState([]);
    const [filters, setFilters] = useState({
        plan: [],
        status: [],
    });

    useEffect(() => {
        fetchPlans();
        fetchUsers();
    }, []);

    // Fetch plans
    const fetchPlans = async () => {
        try {
            const token = localStorage.getItem('admin_token');
            const response = await axios.get(
                `${process.env.REACT_APP_API_BASE_URL}/api/admin/plan-management-list`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (response.data.status_code === 200) {
                setPlans(response.data.results || []);
            }
        } catch (error) {
            console.error('Error fetching plans:', error);
            toast.error('Failed to fetch plans');
        }
    };

    // Fetch users
    const fetchUsers = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('admin_token');
            const response = await axios.get(
                `${process.env.REACT_APP_API_BASE_URL}/api/admin/user-management-list`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            const data = response.data.results || [];
            setUsers(data);
            setFilteredUsers(data);
            setTotalUsers(response.data.total_count || 0);
        } catch (error) {
            console.error('Error fetching users:', error);
            toast.error('Failed to fetch users');
        } finally {
            setLoading(false);
        }
    };

    // Delete user
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
                    { headers: { Authorization: `Bearer ${token}` } }
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

    // Filter & Search logic
    const filterAndSearch = (searchText = '') => {
        const text = (searchText || '').toLowerCase();
        const filtered = users.filter(user => {
            const name = `${user.first_name || ''} ${user.last_name || ''}`.toLowerCase();
            const plan = (user.subscription_name || '').toLowerCase();
            const phone = (user.phone || '').toLowerCase();
            const statusText = user.status === '1' || user.status === 1 ? 'active' : 'inactive';
            const created = user.created_at ? new Date(user.created_at).toLocaleDateString() : '';

            // Apply search
            const matchesSearch =
                name.includes(text) ||
                plan.includes(text) ||
                phone.includes(text) ||
                statusText.includes(text) ||
                created.includes(text);

            // Apply filters
            const matchesPlan = filters.plan.length ? filters.plan.includes(user.subscription_name) : true;
            const matchesStatus = filters.status.length ? filters.status.includes(statusText) : true;

            return matchesSearch && matchesPlan && matchesStatus;
        });

        setFilteredUsers(filtered);
    };

    // Table columns
    const columns = [
        {
            name: 'first_name',
            label: 'NAME',
            options: {
                filter: false,
                sort: false,
                customBodyRenderLite: (dataIndex) => {
                    const user = filteredUsers[dataIndex];
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
            },
        },
        {
            name: 'subscription_name',
            label: 'Plan',
            options: {
                filter: true,
                sort: true,
                filterOptions: {
                    names: plans.map(plan => plan.name),
                    logic(planValue, filtersArray) {
                        return filtersArray.length ? !filtersArray.includes(planValue) : false;
                    }
                },
            },
        },
        {
            name: 'phone',
            label: 'Phone',
            options: { filter: false, sort: true },
        },
        {
            name: 'status',
            label: 'Status',
            options: {
                filter: true,
                sort: true,
                customBodyRender: (value) => (
                    <span className={`badge ${value === '1' ? 'bg-success' : 'bg-danger'}`}>
                        {value === '1' ? 'Active' : 'Inactive'}
                    </span>
                ),
                filterOptions: {
                    names: ['Active', 'Inactive'],
                    logic(value, filtersArray) {
                        const statusText = value === '1' || value === 1 ? 'Active' : 'Inactive';
                        return filtersArray.length ? !filtersArray.includes(statusText) : false;
                    }
                },
            },
        },
        {
            name: 'created_at',
            label: 'Created At',
            options: {
                filter: false,
                sort: true,
                customBodyRender: value => value ? new Date(value).toLocaleDateString() : 'N/A'
            },
        },
        {
            name: 'actions',
            label: 'Actions',
            options: {
                filter: false,
                sort: false,
                download: false,
                customBodyRenderLite: (dataIndex) => {
                    const user = filteredUsers[dataIndex];
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

    // Table options
    const options = {
        serverSide: false,
        selectableRows: 'none',
        search: true,
        filter: true,
        pagination: true, // ✅ disable pagination
        textLabels: {
            body: { noMatch: loading ? 'Loading...' : 'Sorry, no matching records found' },
        },
        onSearchChange: (searchText) => {
            filterAndSearch(searchText);
        }
    };

    return (
        <div className="layout-px-spacing">
            <div className="page-header d-flex justify-content-between">
                <h3>User Management</h3>
                <Link className="btn btn-primary" to="/admin/user-management/create">Create</Link>
            </div>

            <div className="row layout-top-spacing" id="cancel-row">
                <div className="col-12 layout-spacing">
                    <div className="widget-content widget-content-area br-6">
                        <div className="table-responsive">
                            <MUIDataTable
                                title="User List"
                                data={filteredUsers}
                                columns={columns}
                                options={options}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserManagementIndex;

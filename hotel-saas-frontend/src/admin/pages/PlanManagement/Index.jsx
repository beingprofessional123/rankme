import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import MUIDataTable from 'mui-datatables';
import { IconButton, Tooltip } from '@mui/material';
import { Visibility, Edit, Delete } from '@mui/icons-material';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';


const PlanManagementIndex = () => {
    const [plans, setPlans] = useState([]);
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        fetchPlans();
    }, []);

    const fetchPlans = async () => {
        try {
            const token = localStorage.getItem('admin_token');
            const response = await axios.get(
                `${process.env.REACT_APP_API_BASE_URL}/api/admin/plan-management-list`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            if (response.data.status_code === 200) {
                setPlans(response.data.results || []);
                toast.success(response.data.message);
            } else {
                toast.error(response.data.message || 'Failed to fetch plans');
            }
        } catch (error) {
            console.error('Error fetching plans:', error);
            toast.error('Failed to fetch plans');
        }
    };

    const deletePlan = async (id) => {
        const confirm = await Swal.fire({
            title: 'Are you sure?',
            text: 'This action will permanently delete the plan.',
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
                    `${process.env.REACT_APP_API_BASE_URL}/api/admin/plan-management/${id}`,
                    {
                        headers: { Authorization: `Bearer ${token}` },
                    }
                );

                if (response.data.status_code === 200) {
                    toast.success(response.data.message);
                    fetchPlans(); // refresh list
                } else {
                    toast.error(response.data.message || 'Something went wrong.');
                }
            } catch (error) {
                console.error('Error deleting plan:', error);
                const message =
                    error?.response?.data?.message || 'Unexpected error occurred.';
                toast.error(message);
            }
        }
    };


    const columns = [
        {
            name: 'name',
            label: 'Name',
            options: {
                customBodyRenderLite: (dataIndex) => plans[dataIndex].name,
            },
        },
        {
            name: 'price',
            label: 'Price',
            options: {
                customBodyRenderLite: (dataIndex) => `₹${plans[dataIndex].price}`,
            },
        },
        {
            name: 'billing_period',
            label: 'Billing Period',
            options: {
                customBodyRenderLite: (dataIndex) => {
                    const period = plans[dataIndex].billing_period;
                    return period.charAt(0).toUpperCase() + period.slice(1);
                },
            },
        },
        {
            name: 'createdAt',
            label: 'Created At',
            options: {
                customBodyRenderLite: (dataIndex) =>
                    new Date(plans[dataIndex].createdAt).toLocaleDateString(),
            },
        },
        {
            name: 'actions',
            label: 'Actions',
            options: {
                customBodyRenderLite: (dataIndex) => {
                    const plan = plans[dataIndex];
                    return (
                        <>
                            <Tooltip title="View">
                                <IconButton
                                    component={Link}
                                    to={`/admin/plan-management/${plan.id}`}
                                    size="small"
                                    color="primary"
                                >
                                    <Visibility />
                                </IconButton>
                            </Tooltip>
                            <Tooltip title="Edit">
                                <IconButton
                                    component={Link}
                                    to={`/admin/plan-management/${plan.id}/edit`}
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
                                    onClick={() => deletePlan(plan.id)}
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
                        <h3>Plan Management</h3>
                    </div>
                    <div className="page-title page-btn">
                        {/* <Link className="btn btn-primary" to="/admin/plan-management/create">Create Plan</Link> */}
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
                                    title="Plan List"
                                    data={plans}
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

export default PlanManagementIndex;

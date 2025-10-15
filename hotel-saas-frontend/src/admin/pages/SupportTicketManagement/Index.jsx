import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import MUIDataTable from 'mui-datatables';
import { IconButton, Tooltip, CircularProgress } from '@mui/material'; // Import CircularProgress for a spinner
import { Visibility, Edit, Delete } from '@mui/icons-material';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:4000';

const SupportTicketList = () => {
    const [tickets, setTickets] = useState([]);
    const [successMessage, setSuccessMessage] = useState('');
    const [loading, setLoading] = useState(true); // Add a new state for loading

    useEffect(() => {
        fetchTickets();
    }, []);

    const fetchTickets = async () => {
        setLoading(true); // Set loading to true when starting the fetch
        try {
            const token = localStorage.getItem('admin_token');

            const response = await axios.get(
                `${API_BASE_URL}/api/admin/support-ticket`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            setTickets(response.data.tickets || []);
        } catch (error) {
            console.error('Error fetching support tickets:', error);
            const errorMessage = error.response?.data?.message || 'Failed to fetch tickets';
            toast.error(errorMessage);
        } finally {
            setLoading(false); // Set loading to false after the fetch is complete (success or fail)
        }
    };

    const deleteTicket = async (id) => {
        const confirm = await Swal.fire({
            title: 'Are you sure?',
            text: 'This action will permanently delete the support ticket and all its messages.',
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
                    `${API_BASE_URL}/api/admin/support-ticket/${id}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                if (response.data.status) {
                    toast.success(response.data.message);
                    fetchTickets(); // Refresh the list after successful deletion
                } else {
                    toast.error(response.data.message || 'Something went wrong.');
                }
            } catch (error) {
                console.error('Error deleting support ticket:', error);
                const message = error?.response?.data?.message || 'An unexpected error occurred while deleting the ticket.';
                toast.error(message);
            }
        }
    };


    const columns = [
        {
            name: 'ticketNumber', // This name must match the key from your API response
            label: 'Ticket #',
            options: {
                filter: false,
                sort: true,
            },
        },
        {
            name: 'creator',
            label: 'User Name',
            options: {
                filter: true,
                sort: true,
                customBodyRender: (value) => {
                    const userName = value?.name || 'N/A';
                    const userEmail = value?.email || 'N/A';
                    return (
                        <div className="d-flex align-items-center">
                            <div className="m-1">
                                <div><b>{userName}</b></div>
                                <div className="text-muted" style={{ fontSize: '0.875rem' }}>{userEmail}</div>
                            </div>
                        </div>
                    );
                },
            },
        },
        {
            name: 'subject',
            label: 'Subject',
            options: {
                filter: false,
                sort: true,
            },
        },
        {
            name: 'category',
            label: 'Category',
            options: {
                filter: true,
                sort: true,
                filterType: 'dropdown',
                filterOptions: {
                    names: [...new Set(tickets.map(t => t.category).filter(Boolean))]
                },
                customBodyRender: (value) => value || 'N/A',
            },
        },
        {
            name: 'status',
            label: 'Status',
            options: {
                filter: true,
                sort: true,
                filterType: 'dropdown',
                filterOptions: {
                    names: ['Open', 'In Progress', 'Closed'],
                },
                customBodyRender: (value) => {
                    let badgeClass = '';
                    switch (value) {
                        case 'Open':
                            badgeClass = 'bg-danger';
                            break;
                        case 'In Progress':
                            badgeClass = 'bg-warning';
                            break;
                        case 'Closed':
                            badgeClass = 'bg-success';
                            break;
                        default:
                            badgeClass = 'bg-secondary';
                    }
                    return (
                        <span className={`badge ${badgeClass}`}>
                            {value}
                        </span>
                    );
                }
            },
        },
        {
            name: 'createdAt',
            label: 'Opened Date',
            options: {
                filter: true,
                sort: true,
                customBodyRender: (value) =>
                    value ? new Date(value).toLocaleDateString() : 'N/A',
            },
        },
        {
            name: 'actions',
            label: 'Actions',
            options: {
                filter: false,
                sort: false,
                customBodyRender: (value, tableMeta) => {
                    const ticket = tickets[tableMeta.rowIndex];
                    return (
                        <>
                            <Tooltip title="View / Edit">
                                <IconButton
                                    component={Link}
                                    to={`/admin/support-ticket-management/${ticket.id}/edit`}
                                    size="small"
                                >
                                    <Visibility />
                                </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                                <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => deleteTicket(ticket.id)}
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
        <div className="layout-px-spacing">
            <div className="page-header d-flex justify-content-between">
                <div className="page-title">
                    <h3>Support Ticket Management</h3>
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
                        <div className="tabledesign">
                            {loading ? (
                                <div className="d-flex justify-content-center align-items-center py-5" style={{ minHeight: '200px' }}>
                                    <div className="text-center">
                                        <CircularProgress size={40} />
                                        <p className="mt-3 h5">Loading tickets...</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="table-responsive">
                                    <MUIDataTable
                                        title="Support Ticket List"
                                        data={tickets}
                                        columns={columns}
                                        options={options}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SupportTicketList;
import React, { useState, useContext, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { Link } from 'react-router-dom';
import MUIDataTable from 'mui-datatables';
import { PermissionContext } from '../../UserPermission';
import axios from 'axios';
import Swal from 'sweetalert2';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:4000';

const SupportTicketPage = () => {
    const { permissions, role } = useContext(PermissionContext);
    const isCompanyAdmin = role?.name === 'company_admin';
    const canAccess = (action) => {
        if (isCompanyAdmin) return true;
        return permissions?.support_ticket?.[action] === true;
    };

    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedTicket, setSelectedTicket] = useState(null);

    // Function to fetch tickets from the API
    const fetchTickets = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_BASE_URL}/api/support-ticket/list`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            // Assuming your backend returns data with a `createdAt` field
            const formattedTickets = response.data.tickets.map(ticket => ({
                ...ticket,
                date: new Date(ticket.createdAt).toLocaleDateString(),
                status: ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)
            }));

            setTickets(formattedTickets);
        } catch (err) {
            setError('Failed to fetch support tickets. Please try again.');
            console.error('API Error:', err);
        } finally {
            setLoading(false);
        }
    };

    // Use useEffect to fetch tickets on component mount
    useEffect(() => {
        fetchTickets();
    }, []);

    const handleDelete = (ticket) => {
        setSelectedTicket(ticket);
    };

    // Modified confirmDelete to call the API directly
    const confirmDelete = async () => {
        if (selectedTicket) {
            try {
                const token = localStorage.getItem('token');
                await axios.delete(`${API_BASE_URL}/api/support-ticket/delete/${selectedTicket.id}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                // After successful API call, update the local state
                setTickets(prev => prev.filter(t => t.id !== selectedTicket.id));
                Swal.fire('Deleted!', 'The support ticket has been deleted.', 'success');
            } catch (err) {
                Swal.fire('Error!', 'Failed to delete the ticket.', 'error');
                console.error('API Error:', err);
            } finally {
                setSelectedTicket(null);
            }
        }
    };

    const columns = [
        // ADDED: New column for the ticketNumber
        { name: 'ticketNumber', label: 'Ticket ID' },
        { name: 'subject', label: 'Subject' },
        { name: 'priority', label: 'Priority' },
        { name: 'category', label: 'Category' },
        { name: 'date', label: 'Opened Date' },
        {
            name: 'status', label: 'Status', options: {
                customBodyRender: value => (
                    <span className={`status-design ${value === 'Open' ? 'status-g' : 'status-r'}`}>
                        {value}
                    </span>
                )
            }
        },
        {
            name: 'id',
            label: 'ACTION',
            options: {
                customBodyRender: (value, tableMeta) => {
                    const rowIndex = tableMeta.rowIndex;
                    const rowData = tickets[rowIndex];
                    return (
                        <div className="tdaction">
                            {canAccess('edit') && (
                                <Link to={`/support-tickets-edit/${value}`} state={{ data: rowData }}>
                                    <img src={`/user/images/edit.svg`} className="img-fluid" alt="edit" />
                                </Link>
                            )}
                            {canAccess('delete') && (
                                <a
                                    href="#!"
                                    data-bs-toggle="modal"
                                    data-bs-target="#deleteTicketModal"
                                    onClick={() => handleDelete(rowData)}
                                >
                                    <img src={`/user/images/deletetd.svg`} className="img-fluid" alt="delete" />
                                </a>
                            )}
                        </div>
                    );
                },
                sort: false,
                filter: false
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
        pagination: true,
        responsive: 'standard'
    };

    return (
        <DashboardLayout>
            <div className="mainbody">
                <div className="container-fluid">
                    <div className="row breadcrumbrow">
                        <div className="col-md-6">
                            <div className="breadcrumb-sec">
                                <h2>Support Ticket</h2>
                                <nav aria-label="breadcrumb">
                                    <ol className="breadcrumb">
                                        <li className="breadcrumb-item"><Link to="/support-tickets">Home</Link></li>
                                        <li className="breadcrumb-item active" aria-current="page">Support Ticket</li>
                                    </ol>
                                </nav>
                            </div>
                        </div>
                        <div className="col-md-6">
                            <div className="breadcrumb-right">
                                {canAccess('add') && (
                                    <Link to="/support-tickets-add" className="btn btn-info">
                                        <img src={`/user/images/add.svg`} className="img-fluid" alt="Add Ticket" /> Ticket
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="white-bg">
                        {loading ? (
                            <div className="text-center p-5">
                                <p>Loading tickets...</p>
                            </div>
                        ) : error ? (
                            <div className="text-center p-5 text-danger">
                                <p>{error}</p>
                            </div>
                        ) : (
                            <div className="tabledesign">
                                <div className="table-responsive">
                                    <MUIDataTable
                                        title="Support Tickets"
                                        data={tickets}
                                        columns={columns}
                                        options={options}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Delete Confirmation Modal */}
                <div className="modal fade modaldesign data-failed" id="deleteTicketModal" tabIndex="-1">
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h4 className="modal-title">Delete Confirmation</h4>
                                <button type="button" className="btn-close" data-bs-dismiss="modal">&times;</button>
                            </div>
                            <div className="modal-body">
                                <div className="form-design text-center">
                                    <img src={`/user/images/failed.svg`} className="img-fluid mb-3" alt="warning" />
                                    <h3>Delete Ticket</h3>
                                    <p>Are you sure you want to delete <strong>{selectedTicket?.subject}</strong>?</p>
                                    <div className="form-group float-end">
                                        <button type="button" className="btn btn-info cancelbtn" data-bs-dismiss="modal" onClick={confirmDelete}>
                                            Confirm Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default SupportTicketPage;
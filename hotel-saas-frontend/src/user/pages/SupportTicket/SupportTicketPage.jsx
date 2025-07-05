import React, { useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { Link } from 'react-router-dom';
import MUIDataTable from 'mui-datatables';

const initialTickets = [
    { id: 1, subject: 'Lorem Ipsum is', category: 'Lorem Ipsum', date: '22/05/2015', status: 'Active' },
    { id: 2, subject: 'Lorem Ipsum is', category: 'Lorem Ipsum', date: '21/05/2015', status: 'Inactive' },
    { id: 3, subject: 'Lorem Ipsum is', category: 'Lorem Ipsum', date: '20/05/2015', status: 'Active' },
    { id: 4, subject: 'Lorem Ipsum is', category: 'Lorem Ipsum', date: '19/05/2015', status: 'Inactive' },
    { id: 5, subject: 'Lorem Ipsum is', category: 'Lorem Ipsum', date: '18/05/2015', status: 'Active' },
    { id: 6, subject: 'Lorem Ipsum is', category: 'Lorem Ipsum', date: '17/05/2015', status: 'Active' },
    { id: 7, subject: 'Lorem Ipsum is', category: 'Lorem Ipsum', date: '16/05/2015', status: 'Inactive' },
    { id: 8, subject: 'Lorem Ipsum is', category: 'Lorem Ipsum', date: '15/05/2015', status: 'Inactive' },
    { id: 9, subject: 'Lorem Ipsum is', category: 'Lorem Ipsum', date: '14/05/2015', status: 'Active' },
    { id: 10, subject: 'Lorem Ipsum is', category: 'Lorem Ipsum', date: '13/05/2015', status: 'Active' }
];

const SupportTicketPage = () => {
    const [tickets, setTickets] = useState(initialTickets);
    const [selectedTicket, setSelectedTicket] = useState(null);

    const handleDelete = (ticket) => {
        setSelectedTicket(ticket);
    };

    const confirmDelete = () => {
        if (selectedTicket) {
            setTickets(prev => prev.filter(t => t.id !== selectedTicket.id));
            setSelectedTicket(null);
        }
    };

    const columns = [
        { name: 'id', label: 'ID' },
        { name: 'subject', label: 'Subject' },
        { name: 'category', label: 'Category' },
        { name: 'date', label: 'Opened Date' },
        {
            name: 'status',
            label: 'Status',
            options: {
                customBodyRender: value => (
                    <span className={`status-design ${value === 'Active' ? 'status-g' : 'status-r'}`}>
                        {value}
                    </span>
                )
            }
        },
        {
            name: 'id',
            label: 'Action',
            options: {
                customBodyRender: (value, tableMeta) => {
                    const rowIndex = tableMeta.rowIndex;
                    const rowData = tickets[rowIndex];
                    return (
                        <div className="tdaction">
                            <Link to={`/support-tickets-view/${value}`} state={{ data: rowData }}>
                                <img src={`/user/images/view.svg`} className="img-fluid" alt="view" />
                            </Link>
                            <Link to={`/support-tickets-edit/${value}`} state={{ data: rowData }}>
                                <img src={`/user/images/edit.svg`} className="img-fluid" alt="edit" />
                            </Link>
                            <a
                                href="#!"
                                data-bs-toggle="modal"
                                data-bs-target="#deleteTicketModal"
                                onClick={() => handleDelete(rowData)}
                            >
                                <img src={`/user/images/deletetd.svg`} className="img-fluid" alt="delete" />
                            </a>
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
                                <Link to="/support-tickets-add" className="btn btn-info">
                                    <img src={`/user/images/add.svg`} className="img-fluid" alt="Add Ticket" /> Ticket
                                </Link>
                            </div>
                        </div>
                    </div>

                    <div className="white-bg">
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
                                        <button type="button" className="btn btn-info cancelbtn"  data-bs-dismiss="modal"  onClick={confirmDelete}>
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

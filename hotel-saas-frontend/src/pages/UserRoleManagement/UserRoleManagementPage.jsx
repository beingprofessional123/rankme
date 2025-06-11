import React, { useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import MUIDataTable from 'mui-datatables';
import { Link } from 'react-router-dom';

import roomadsvg from '../../assets/images/roomadd.svg';
import editsvg from '../../assets/images/edit.svg';
import deletetdsvg from '../../assets/images/deletetd.svg';
import failedsvg from '../../assets/images/failed.svg';

const initialData = [
    { id: 1, name: 'Ayaan Khan', email: 'ayaan@123gmail.com', role: 'Revenue Manager', status: 'Active' },
    { id: 2, name: 'Jennifer Lawrence', email: 'jennifer@123gmail.com', role: 'General Manager', status: 'Inactive' },
    { id: 3, name: 'Logan Lerman', email: 'logan@123gmail.com', role: 'Analyst/Viewer', status: 'Active' },
    { id: 4, name: 'Johnny Depp', email: 'johnny@123gmail.com', role: 'Revenue Manager', status: 'Inactive' },
    { id: 5, name: 'Jessica Alba', email: 'jessica@123gmail.com', role: 'General Manager', status: 'Active' },
    { id: 6, name: 'Matt Damon', email: 'matt@123gmail.com', role: 'Revenue Manager', status: 'Active' },
    { id: 7, name: 'Charlie McDermott', email: 'charlie@123gmail.com', role: 'Analyst/Viewer', status: 'Inactive' },
    { id: 8, name: 'Eva Green', email: 'eva@123gmail.com', role: 'General Manager', status: 'Inactive' },
    { id: 9, name: 'Dave Franco', email: 'dave@123gmail.com', role: 'Revenue Manager', status: 'Active' },
    { id: 10, name: 'Franco Dave', email: 'franco@123gmail.com', role: 'Revenue Manager', status: 'Active' }
];

const UserRoleManagementPage = () => {
    const [tableData, setTableData] = useState(initialData);
    const [selectedUser, setSelectedUser] = useState(null);

    const handleDelete = (user) => {
        setSelectedUser(user);
    };

    const confirmDelete = () => {
        if (selectedUser) {
            setTableData(prev => prev.filter(u => u.id !== selectedUser.id));
            setSelectedUser(null);
        }
    };

    const columns = [
        { name: 'id', label: 'ID' },
        { name: 'name', label: 'Name' },
        { name: 'email', label: 'Email Address' },
        { name: 'role', label: 'Role' },
        {
            name: 'status',
            label: 'Status',
            options: {
                customBodyRender: (value) => (
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
                filter: false,
                sort: false,
                customBodyRender: (value, tableMeta) => {
                    const rowIndex = tableMeta.rowIndex;
                    const user = tableData[rowIndex];
                    return (
                        <div className="tdaction">
                            <Link to={`/user-role-management-edit/${value}`} state={{ data: user }}>
                                <img src={editsvg} className="img-fluid" alt="edit" />
                            </Link>
                            <a
                                href="#!"
                                data-bs-toggle="modal"
                                data-bs-target="#mydeleteuserModal"
                                onClick={() => handleDelete(user)}
                            >
                                <img src={deletetdsvg} className="img-fluid" alt="delete" />
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
    };

    return (
        <DashboardLayout>
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
                                    <img src={roomadsvg} className="img-fluid" alt="Add User" /> User
                                </Link>
                            </div>
                        </div>
                    </div>

                    <div className=""> {/* white-bg p-3 */}
                        <MUIDataTable
                            title="User Role Management"
                            data={tableData}
                            columns={columns}
                            options={options}
                        />
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            <div className="modal fade modaldesign data-failed" id="mydeleteuserModal" tabIndex="-1">
                <div className="modal-dialog">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h4 className="modal-title">Delete Confirmation</h4>
                            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>

                        <div className="modal-body">
                            <div className="form-design text-center">
                                <img src={failedsvg} className="img-fluid mb-3" alt="" />
                                <h3>Delete User</h3>
                                <p>Are you sure you want to delete <strong>{selectedUser?.name}</strong>?</p>
                                <div className="form-group float-end">
                                    <button
                                        type="button"
                                        className="btn btn-info cancelbtn"
                                        onClick={confirmDelete}
                                        data-bs-dismiss="modal" // ✅ closes modal automatically
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

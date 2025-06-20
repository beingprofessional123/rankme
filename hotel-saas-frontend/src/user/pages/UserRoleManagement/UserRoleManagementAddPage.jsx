import React from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { Link } from 'react-router-dom';

const UserRoleManagementAddPage = () => {
    return (
        <DashboardLayout>
            <div className="mainbody">
                <div className="container-fluid">

                    <div className="row breadcrumbrow">
                        <div className="col-md-12">
                            <div className="breadcrumb-sec">
                                <h2>User Add</h2>
                                <nav aria-label="breadcrumb">
                                    <ol className="breadcrumb">
                                        <li className="breadcrumb-item"><Link to="/user-role-management">Home</Link></li>
                                        <li className="breadcrumb-item active" aria-current="page">User Add</li>
                                    </ol>
                                </nav>
                            </div>
                        </div>
                    </div>
                    <div className="white-bg">
                        <div className="form-design">
                            <form>
                                <div className="row">
                                    <div className="col-md-6">
                                        <div className="form-group">
                                            <label className="form-label">Full Name</label>
                                            <input type="text" className="form-control" id="" placeholder="Full Name" />
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="form-group">
                                            <label className="form-label">Email Address</label>
                                            <input type="text" className="form-control" id="" placeholder="Email Address" />
                                        </div>
                                    </div>
                                    <div className="col-md-12">
                                        <div className="form-group">
                                            <label className="form-label">Select Role</label>
                                            <select className="form-select form-control">
                                                <option>Select Role</option>
                                                <option>2</option>
                                                <option>3</option>
                                                <option>4</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div className="addentry-btn">
                                    <button type="submit" className="btn btn-info">Submit</button>
                                </div>

                            </form>
                        </div>

                    </div>






                </div>
            </div>
        </DashboardLayout>
    );
};

export default UserRoleManagementAddPage;

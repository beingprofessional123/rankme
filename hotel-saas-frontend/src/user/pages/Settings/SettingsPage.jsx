import React from 'react';
import DashboardLayout from '../../components/DashboardLayout';

const SettingsPage = () => {

    return (
        <DashboardLayout>
            <div className="mainbody">
                <div className="container-fluid">

                    <div className="row breadcrumbrow">
                        <div className="col-md-12">
                            <div className="breadcrumb-sec">
                                <h2>Settings</h2>
                                <nav aria-label="breadcrumb">
                                    <ol className="breadcrumb">
                                        <li className="breadcrumb-item"><a href="#">Home</a></li>
                                        <li className="breadcrumb-item active" aria-current="page">Settings</li>
                                    </ol>
                                </nav>
                            </div>
                        </div>
                    </div>
                    <div className="white-bg">
                        <div className="report-tabdesign">
                            <ul className="nav nav-tabs" role="tablist">
                                <li className="nav-item">
                                    <a className="nav-link active" data-bs-toggle="tab" href="#home1">General Settings</a>
                                </li>
                                <li className="nav-item">
                                    <a className="nav-link" data-bs-toggle="tab" href="#home2">Change Password</a>
                                </li>
                            </ul>
                        </div>
                        <div className="tab-content">
                            <div id="home1" className="tab-pane active">
                                <div className="form-design">
                                    <form>
                                        <div className="row">
                                            <div className="col-md-12">
                                                <div className="form-group">
                                                    <label className="form-label">Upload Logo</label>
                                                    <div className="profile-img">
                                                        <div className="circle">
                                                            <img className="profile-pic" src={`/user/images/logoww.png`} />
                                                        </div>
                                                        <div className="p-image">
                                                            <img src={`/user/images/uploadfile.svg`} className="img-fluid upload-buttons" alt="" />
                                                                <input className="file-upload" type="file" accept="image/*" />
                                                                </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="col-md-6">
                                                    <div className="form-group">
                                                        <label className="form-label">Company Name</label>
                                                        <input type="text" className="form-control" id="" placeholder="Company Name" />
                                                    </div>
                                                </div>
                                                <div className="col-md-6">
                                                    <div className="form-group">
                                                        <label className="form-label">Full Name</label>
                                                        <input type="text" className="form-control" id="" placeholder="Full Name" />
                                                    </div>
                                                </div>
                                                <div className="col-md-6">
                                                    <div className="form-group">
                                                        <label className="form-label">Email Address</label>
                                                        <input type="email" className="form-control" id="" placeholder="Email Address" />
                                                    </div>
                                                </div>
                                                <div className="col-md-6">
                                                    <div className="form-group">
                                                        <label className="form-label">Phone Number</label>
                                                        <input type="text" className="form-control" id="" placeholder="Phone Number" />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="addentry-btn">
                                                <button type="submit" className="btn btn-info">Submit</button>
                                            </div>
                                    </form>
                                </div>
                            </div>
                            <div id="home2" className="tab-pane fade">
                                <div className="form-design">
                                    <form>
                                        <div className="row">
                                            <div className="col-md-12">
                                                <div className="form-group">
                                                    <label className="form-label">Current Password</label>
                                                    <input type="text" className="form-control" id="" placeholder="Current Password" />
                                                </div>
                                            </div>
                                            <div className="col-md-6">
                                                <div className="form-group">
                                                    <label className="form-label">New Password</label>
                                                    <input type="text" className="form-control" id="" placeholder="New Password" />
                                                </div>
                                            </div>
                                            <div className="col-md-6">
                                                <div className="form-group">
                                                    <label className="form-label">Confirm New Password</label>
                                                    <input type="email" className="form-control" id="" placeholder="Confirm New Password" />
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
                </div>
            </div>

        </DashboardLayout>
    );
};

export default SettingsPage;

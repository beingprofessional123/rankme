import React from 'react';
import DashboardLayout from '../../components/DashboardLayout';

const SettingsPage = () => {

    return (
        <DashboardLayout>
            <div class="mainbody">
                <div class="container-fluid">

                    <div class="row breadcrumbrow">
                        <div class="col-md-12">
                            <div class="breadcrumb-sec">
                                <h2>Settings</h2>
                                <nav aria-label="breadcrumb">
                                    <ol class="breadcrumb">
                                        <li class="breadcrumb-item"><a href="#">Home</a></li>
                                        <li class="breadcrumb-item active" aria-current="page">Settings</li>
                                    </ol>
                                </nav>
                            </div>
                        </div>
                    </div>


                    <div class="white-bg">
                        <div class="report-tabdesign">
                            <ul class="nav nav-tabs" role="tablist">
                                <li class="nav-item">
                                    <a class="nav-link active" data-bs-toggle="tab" href="#home1">General Settings</a>
                                </li>
                                <li class="nav-item">
                                    <a class="nav-link" data-bs-toggle="tab" href="#home2">Change Password</a>
                                </li>
                            </ul>
                        </div>
                        <div class="tab-content">
                            <div id="home1" class="tab-pane active">
                                <div class="form-design">
                                    <form>
                                        <div class="row">
                                            <div class="col-md-12">
                                                <div class="form-group">
                                                    <label class="form-label">Upload Logo</label>
                                                    <div class="profile-img">
                                                        <div class="circle">
                                                            <img class="profile-pic" src={`/user/images/logoww.png`} />
                                                        </div>
                                                        <div class="p-image">
                                                            <img src={`/user/images/uploadfile.svg`} class="img-fluid upload-buttons" alt="" />
                                                                <input class="file-upload" type="file" accept="image/*" />
                                                                </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div class="col-md-6">
                                                    <div class="form-group">
                                                        <label class="form-label">Company Name</label>
                                                        <input type="text" class="form-control" id="" placeholder="Company Name" />
                                                    </div>
                                                </div>
                                                <div class="col-md-6">
                                                    <div class="form-group">
                                                        <label class="form-label">Full Name</label>
                                                        <input type="text" class="form-control" id="" placeholder="Full Name" />
                                                    </div>
                                                </div>
                                                <div class="col-md-6">
                                                    <div class="form-group">
                                                        <label class="form-label">Email Address</label>
                                                        <input type="email" class="form-control" id="" placeholder="Email Address" />
                                                    </div>
                                                </div>
                                                <div class="col-md-6">
                                                    <div class="form-group">
                                                        <label class="form-label">Phone Number</label>
                                                        <input type="text" class="form-control" id="" placeholder="Phone Number" />
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="addentry-btn">
                                                <button type="submit" class="btn btn-info">Submit</button>
                                            </div>
                                    </form>
                                </div>
                            </div>
                            <div id="home2" class="tab-pane fade">
                                <div class="form-design">
                                    <form>
                                        <div class="row">
                                            <div class="col-md-12">
                                                <div class="form-group">
                                                    <label class="form-label">Current Password</label>
                                                    <input type="text" class="form-control" id="" placeholder="Current Password" />
                                                </div>
                                            </div>
                                            <div class="col-md-6">
                                                <div class="form-group">
                                                    <label class="form-label">New Password</label>
                                                    <input type="text" class="form-control" id="" placeholder="New Password" />
                                                </div>
                                            </div>
                                            <div class="col-md-6">
                                                <div class="form-group">
                                                    <label class="form-label">Confirm New Password</label>
                                                    <input type="email" class="form-control" id="" placeholder="Confirm New Password" />
                                                </div>
                                            </div>
                                        </div>
                                        <div class="addentry-btn">
                                            <button type="submit" class="btn btn-info">Submit</button>
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

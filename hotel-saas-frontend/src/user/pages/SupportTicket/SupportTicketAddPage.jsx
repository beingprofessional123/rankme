import React, { useContext } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { Link } from 'react-router-dom';
import { PermissionContext } from '../../UserPermission';

const SupportTicketAddPage = () => {
  const { permissions, role } = useContext(PermissionContext);
  const isCompanyAdmin = role?.name === 'company_admin';
  const canAccess = (action) => {
    if (isCompanyAdmin) return true;
    return permissions?.support_ticket?.[action] === true;
  };

  return (
    <DashboardLayout>
      <div className="mainbody">
        <div className="container-fluid">

          <div className="row breadcrumbrow">
            <div className="col-md-12">
              <div className="breadcrumb-sec">
                <h2>Support Ticket Add</h2>
                <nav aria-label="breadcrumb">
                  <ol className="breadcrumb">
                    <li className="breadcrumb-item"><Link to="/support-tickets">Home</Link></li>
                    <li className="breadcrumb-item active" aria-current="page">Support Ticket Add</li>
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
                      <label className="form-label">Subject</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Subject"
                      />
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="form-group">
                      <label className="form-label">Category</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Category"
                      />
                    </div>
                  </div>

                  <div className="col-md-12">
                    <div className="form-group">
                      <label className="form-label">File Upload</label>
                      <div className="fileupload">
                        <input
                          type="file"
                          className="form-control d-control"
                          id="file-1"
                          placeholder="Choose Media"
                        />
                        <label className="fileupload-label" htmlFor="file-1">
                          <img
                            src={`/user/images/uploadfile.svg`}
                            className="img-fluid"
                            alt="upload icon"
                          />
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="col-md-12">
                    <div className="form-group">
                      <label className="form-label">Description</label>
                      <textarea
                        className="form-control"
                        rows={6}
                        placeholder="Description"
                      ></textarea>
                    </div>
                  </div>

                </div>

                <div className="addentry-btn">
                  {canAccess('add') && (
                  <button type="submit" className="btn btn-info">Submit</button>
                  )}
                </div>
              </form>
            </div>
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
};

export default SupportTicketAddPage;

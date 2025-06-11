import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import uploadfilesvg from '../../assets/images/uploadfile.svg';

const SupportTicketEditPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const ticket = location.state?.data;

  const [formData, setFormData] = useState({
    subject: '',
    category: '',
    date: '',
    status: 'Active',
    description: '',
    file: null,
  });

  useEffect(() => {
    if (ticket) {
      const parseDate = (dateStr) => {
        if (!dateStr) return '';
        const parts = dateStr.split('/');
        if (parts.length !== 3) return '';
        const [dd, mm, yyyy] = parts;
        return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
      };

      setFormData({
        subject: ticket.subject || '',
        category: ticket.category || '',
        date: ticket.date ? parseDate(ticket.date) : '',
        status: ticket.status || 'Active',
        description: ticket.description || '',
        file: null, // Can't prefill file inputs for security reasons
      });
    }
  }, [ticket]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      file: e.target.files[0] || null,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Updated Ticket:', formData);
    // TODO: Submit update via API
    navigate('/support-tickets');
  };

  if (!ticket) {
    return (
      <DashboardLayout>
        <div className="mainbody">
          <div className="container-fluid">
            <div className="alert alert-danger mt-5">
              No ticket data found. Please go back to the{' '}
              <a href="/support-tickets">Support Tickets</a> page.
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mainbody">
        <div className="container-fluid">
          <div className="row breadcrumbrow">
            <div className="col-md-12">
              <div className="breadcrumb-sec">
                <h2>Edit Support Ticket</h2>
                <nav aria-label="breadcrumb">
                  <ol className="breadcrumb">
                    <li className="breadcrumb-item">
                      <a href="/support-tickets">Home</a>
                    </li>
                    <li className="breadcrumb-item active" aria-current="page">
                      Edit Ticket
                    </li>
                  </ol>
                </nav>
              </div>
            </div>
          </div>

          <div className="white-bg">
            <div className="form-design">
              <form onSubmit={handleSubmit}>
                <div className="row">

                  <div className="col-md-6">
                    <div className="form-group">
                      <label className="form-label">Subject</label>
                      <input
                        type="text"
                        name="subject"
                        className="form-control"
                        value={formData.subject}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="form-group">
                      <label className="form-label">Category</label>
                      <input
                        type="text"
                        name="category"
                        className="form-control"
                        value={formData.category}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="form-group">
                      <label className="form-label">Date</label>
                      <input
                        type="date"
                        name="date"
                        className="form-control"
                        value={formData.date}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="form-group">
                      <label className="form-label">Status</label>
                      <select
                        name="status"
                        className="form-select form-control"
                        value={formData.status}
                        onChange={handleChange}
                      >
                        <option value="Active">Active</option>
                        <option value="Pending">Pending</option>
                        <option value="Resolved">Resolved</option>
                        <option value="Closed">Closed</option>
                      </select>
                    </div>
                  </div>

                  {/* File Upload */}
                  <div className="col-md-12">
                    <div className="form-group">
                      <label className="form-label">File Upload</label>
                      <div className="fileupload">
                        <input
                          type="file"
                          className="form-control d-control"
                          id="file-1"
                          onChange={handleFileChange}
                        />
                        <label className="fileupload-label" htmlFor="file-1">
                          <img
                            src={uploadfilesvg}
                            className="img-fluid"
                            alt="upload icon"
                          />
                        </label>
                      </div>
                      {formData.file && (
                        <small>Selected file: {formData.file.name}</small>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  <div className="col-md-12">
                    <div className="form-group">
                      <label className="form-label">Description</label>
                      <textarea
                        className="form-control"
                        rows={6}
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        placeholder="Description"
                      ></textarea>
                    </div>
                  </div>

                </div>

                <div className="addentry-btn">
                  <button type="submit" className="btn btn-info">
                    Update
                  </button>
                </div>
              </form>
            </div>
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
};

export default SupportTicketEditPage;

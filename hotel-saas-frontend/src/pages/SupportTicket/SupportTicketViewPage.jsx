import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';

const SupportTicketViewPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const ticket = location.state?.data;

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
                <h2>View Support Ticket</h2>
                <nav aria-label="breadcrumb">
                  <ol className="breadcrumb">
                    <li className="breadcrumb-item">
                      <a href="/support-tickets">Home</a>
                    </li>
                    <li className="breadcrumb-item active" aria-current="page">
                      View Ticket
                    </li>
                  </ol>
                </nav>
              </div>
            </div>
          </div>

          <div className="white-bg p-4">
            <dl className="row">
              <dt className="col-sm-3">Subject</dt>
              <dd className="col-sm-9">{ticket.subject}</dd>

              <dt className="col-sm-3">Category</dt>
              <dd className="col-sm-9">{ticket.category}</dd>

              <dt className="col-sm-3">Date</dt>
              <dd className="col-sm-9">{ticket.date}</dd>

              <dt className="col-sm-3">Status</dt>
              <dd className="col-sm-9">{ticket.status}</dd>
            </dl>

            <div className="mt-3">
              <button
                className="btn btn-secondary me-2"
                onClick={() => navigate('/support-tickets')}
              >
                Back to Tickets
              </button>

              <button
                className="btn btn-primary"
                onClick={() =>
                  navigate(`/support-tickets-edit/${ticket.id}`, { state: { data: ticket } })
                }
              >
                Edit Ticket
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SupportTicketViewPage;

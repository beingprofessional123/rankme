import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const PlanManagementView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [plan, setPlan] = useState(null);

  useEffect(() => {
    fetchPlanDetails();
  }, []);

  const fetchPlanDetails = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await axios.get(
        `${process.env.REACT_APP_API_BASE_URL}/api/admin/plan-management/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.status_code === 200) {
        setPlan(response.data.results);
        toast.success('Plan details fetched successfully!');
      } else {
        toast.error('Failed to fetch plan details');
      }
    } catch (error) {
      console.error('Error fetching plan:', error);
      toast.error('An unexpected error occurred while fetching plan');
    }
  };

  if (!plan) {
    return <div className="text-center my-5">Loading plan details...</div>;
  }

  return (
    <div>
      <div className="layout-px-spacing">
        <div className="page-header d-flex justify-content-between">
          <div className="page-title">
            <h3>View Plan</h3>
          </div>
          <div className="page-title">
            <Link className="btn btn-primary" to="/admin/plan-management">Back</Link>
          </div>
        </div>

        <div className="row layout-top-spacing">
          <div className="col-xl-12 layout-spacing">
            <div className="user-profile layout-spacing user-managementview">
              <div className="widget-content widget-content-area">
                <div className="d-flex justify-content-between">
                  <h3>Plan Information</h3>
                  <Link to={`/admin/plan-management/${plan.id}/edit`} className="mt-2 edit-profile">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                      viewBox="0 0 24 24" fill="none" stroke="currentColor"
                      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                      className="feather feather-edit-3">
                      <path d="M12 20h9"></path>
                      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                    </svg>
                  </Link>
                </div>

                <div className="text-center user-info mt-3 mb-4">
                  {/* <img
                    src="/admin/assets/img/plan-icon.png"
                    alt="Plan"
                    className="rounded-circle mb-2"
                    width="90"
                    height="90"
                  /> */}
                  <p><b>{plan.name}</b></p>
                </div>

                <div className="user-info-list">
                  <ul className="contacts-block list-unstyled">
                    <li><strong>Name:</strong> {plan.name}</li>
                    <li><strong>Price:</strong> ₹{plan.price}</li>
                    <li><strong>Billing Period:</strong> {plan.billing_period}</li>
                    <li><strong>Created At:</strong> {new Date(plan.createdAt).toLocaleString()}</li>
                    <li><strong>Updated At:</strong> {new Date(plan.updatedAt).toLocaleString()}</li>
                    <li><strong>Plan ID:</strong> {plan.id}</li>
                    <li>
                      <strong>Features:</strong>
                      <ul className="mt-2">
                        {plan.features && Object.entries(plan.features).map(([key, value], idx) => (
                          <li key={idx}>
                            <b>{key}:</b> {value}
                          </li>
                        ))}
                      </ul>
                    </li>
                  </ul>
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlanManagementView;

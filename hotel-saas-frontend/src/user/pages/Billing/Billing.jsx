import React, { useState, useEffect } from 'react';
import axios from 'axios';
import PlanCard from './PlanCard';
import CardDetails from './CardDetails';
import DashboardLayout from '../../components/DashboardLayout'; // Correct import path for DashboardLayout
import { Link } from 'react-router-dom';

// No import for Billing.css anymore, as we are using Tailwind

const Billing = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const token = localStorage.getItem('token'); // Assuming you store your token in localStorage
        if (!token) {
          setError('Authentication token not found. Please log in.');
          setLoading(false);
          return;
        }

        const response = await axios.get(
          `${process.env.REACT_APP_API_BASE_URL}/api/company/subscriptions`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const formattedPlans = response.data.map(plan => {
          const buttonType = 'primary';
          const buttonText = 'Select Plan';

          const f = plan.features;
          const features = [
            { text: 'Users', value: f.users, checked: true },
            { text: 'Storage', value: f.storage, checked: true },
            { text: 'Support', value: f.support, checked: true },
            { text: 'Projects', value: f.projects, checked: true },
            { text: 'Analytics', value: f.analytics ? 'Yes' : 'No', checked: true },
            { text: 'API Access', value: f.api_access ? 'Yes' : 'No', checked: true },
            { text: 'Uptime SLA', value: f.uptime_sla, checked: true },
            { text: 'Data Backup', value: f.data_backup, checked: true },
            { text: 'Billing Cycle', value: f.billing_cycle, checked: true },
          ];

          return {
            id: plan.id,
            name: plan.name,
            price: `$${plan.price}${plan.billing_period === 'monthly' ? '/Month' : '/Year'}`,
            features: features,
            buttonText: buttonText,
            buttonType: buttonType,
          };
        });

        setPlans(formattedPlans);
      } catch (err) {
        console.error('Error fetching subscription plans:', err);
        setError('Failed to load subscription plans. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="mainbody">
          <div className="container-fluid">
            <div className="row breadcrumbrow">
              <div className="col-md-12">
                <div className="breadcrumb-sec">
                  <h2>Upgrade Plan</h2>
                  <nav aria-label="breadcrumb">
                    <ol className="breadcrumb">
                      <li className="breadcrumb-item"><Link href="#">Home</Link></li>
                      <li className="breadcrumb-item active" aria-current="page">Upgrade Plan</li>
                    </ol>
                  </nav>
                </div>
              </div>
            </div>
            <div className="text-lg text-gray-600">Loading plans...</div>

          </div>
        </div>
      </DashboardLayout >
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="mainbody">
          <div className="container-fluid">
            <div className="row breadcrumbrow">
              <div className="col-md-12">
                <div className="breadcrumb-sec">
                  <h2>Upgrade Plan</h2>
                  <nav aria-label="breadcrumb">
                    <ol className="breadcrumb">
                      <li className="breadcrumb-item"><Link href="#">Home</Link></li>
                      <li className="breadcrumb-item active" aria-current="page">Upgrade Plan</li>
                    </ol>
                  </nav>
                </div>
              </div>
            </div>
            <div className="text-lg text-red-500">{error}</div>

          </div>
        </div>
      </DashboardLayout >
    );
  }

  return (
    <DashboardLayout>
      <div className="mainbody">
        <div className="container-fluid">
          <div className="row breadcrumbrow">
            <div className="col-md-12">
              <div className="breadcrumb-sec">
                <h2>Upgrade Plan</h2>
                <nav aria-label="breadcrumb">
                  <ol className="breadcrumb">
                    <li className="breadcrumb-item"><Link href="#">Home</Link></li>
                    <li className="breadcrumb-item active" aria-current="page">Upgrade Plan</li>
                  </ol>
                </nav>
              </div>
            </div>
          </div>
          <div className="planchoose-sec">
            <div className="row">
              {plans.map((plan) => (
                <PlanCard key={plan.id} {...plan} />
              ))}
            </div>
          </div>
          <div className="white-bg billingmain">
            <CardDetails />
          </div>
        </div>
      </div>
    </DashboardLayout >
  );
};

export default Billing;
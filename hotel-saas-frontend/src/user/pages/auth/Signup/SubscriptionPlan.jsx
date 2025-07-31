// src/pages/auth/SubscriptionPlan.jsx
import React, { useEffect, useState, useContext } from 'react';
import Button from '../../../components/forms/Button';
import AuthLayout from '../../../layouts/AuthLayout';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { loadStripe } from '@stripe/stripe-js';
import { toast } from 'react-toastify';
import { PermissionContext } from '../../../UserPermission';

const SubscriptionPlan = () => {
  const { role } = useContext(PermissionContext);
  const isCompanyAdmin = role?.name === 'company_admin';
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isPaying, setIsPaying] = useState(false);

  const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLIC_KEY);

  useEffect(() => {
    if (role && !isCompanyAdmin) {
      navigate('/dashboard');
    }
  }, [role, isCompanyAdmin, navigate]);

  useEffect(() => {
    fetchUserSubscription();
    document.body.classList.add('loginbg');
    return () => {
      document.body.classList.remove('loginbg');
    };
  }, []);

  const fetchPlans = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
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
      setPlans(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching subscription plans:', err);
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      } else {
        setError('Failed to load subscription plans.');
      }
      setLoading(false);
    }
  };

  const fetchUserSubscription = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await axios.get(
        `${process.env.REACT_APP_API_BASE_URL}/api/company/subscriptions-by-user`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const { results: subscription, hotelExists } = response.data;

      const isFreeAndActive =
        subscription?.subscriptionPlan?.billing_period === 'free' && subscription?.status === 'active';

      const isSubscriptionActive =
        subscription?.status === 'active' && new Date(subscription?.expires_at) > new Date();

      if (isFreeAndActive || isSubscriptionActive) {
        if (hotelExists) {
          navigate('/dashboard');
        } else {
          navigate('/setup/setup-wizard');
        }
      } else {
        fetchPlans();
      }

      setLoading(false);
    } catch (err) {
      console.error('Error fetching user subscription:', err);
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      } else {
        setError('Failed to load your subscription plan.');
      }
      setLoading(false);
    }
  };

  const handleSelectPlan = (plan) => {
    setSelectedPlan(plan);
    handlePay(plan); // Always trigger payment using Stripe
  };

  const handlePay = async (plan) => {
    if (!plan) {
      toast.warning('Please select a plan.');
      return;
    }

    setIsPaying(true);
    let response;
    try {
      const token = localStorage.getItem('token');
      response = await axios.post(
        `${process.env.REACT_APP_API_BASE_URL}/api/payments/create-payment`,
        {
          subscription_id: plan.id,
          amount: plan.price,
          gateway: 'stripe', // Use Stripe by default
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.billingType === 'free' && response.data.userSubscription.status === 'active') {
        navigate('/setup/setup-wizard');
        return;
      }

      const stripe = await stripePromise;
      const result = await stripe.redirectToCheckout({ sessionId: response.data.sessionId });

      if (result.error) {
        toast.error(`Payment failed: ${result.error.message}`);
        console.error('Stripe checkout error:', result.error);
      }
    } catch (err) {
      if (response?.data?.billingType !== 'free' && response?.data?.userSubscription.status !== 'active') {
        console.error('Payment initiation failed:', err);
        toast.error(err.response?.data?.message || 'Failed to start payment. Please try again.');
      }
    } finally {
      setIsPaying(false);
    }
  };

  return (
    <AuthLayout>
      <section className="subscription-sec">
        <div className="container">
          <div className="row">
            <div className="col-md-12">
              <div className="formheading">
                <h1>Pricing & Packages</h1>
              </div>
            </div>
          </div>
          <div className="row">
            {loading ? (
              <p className="text-center w-full">Loading subscription plans...</p>
            ) : error ? (
              <p className="text-center text-red-500 w-full">{error}</p>
            ) : plans.length === 0 ? (
              <p className="text-center w-full">No subscription plans available at the moment.</p>
            ) : (
              plans.map((plan) => (
                <div className="col-md-4" key={plan.id}>
                  <div className="subscription-card">
                    <div className="subscription-heading">
                      <h2>{plan.name}</h2>
                      <h6>
                        {plan.price === 0
                          ? 'Free'
                          : `$${plan.price.toFixed(2)}/${plan.billing_period}`}
                      </h6>
                    </div>
                    <div className="subscription-desc">
                      <ul>
                        {plan.features &&
                          Object.entries(plan.features).map(([key, value]) => (
                            <li key={key}>
                              <span className="subscription-desc-text">{key.replace(/_/g, ' ')}</span>
                              <span className="subscription-desc-value">
                                {typeof value === 'boolean' ? (
                                  <img
                                    src={value ? `/user/images/check.svg` : `/user/images/close.svg`}
                                    className="img-fluid"
                                    alt={value ? 'Available' : 'Not Available'}
                                  />
                                ) : (
                                  value
                                )}
                              </span>
                            </li>
                          ))}
                      </ul>
                      <Button
                        onClick={() => handleSelectPlan(plan)}
                        className="btn btn-info"
                        disabled={isPaying}
                      >
                        {isPaying && selectedPlan?.id === plan.id && (
                          <span
                            className="spinner-border spinner-border-sm me-2"
                            role="status"
                            aria-hidden="true"
                          ></span>
                        )}
                        {isPaying && selectedPlan?.id === plan.id ? 'Processing...' : 'Select Plan'}
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </AuthLayout>
  );
};

export default SubscriptionPlan;

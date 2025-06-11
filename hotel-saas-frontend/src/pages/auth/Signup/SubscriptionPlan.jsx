// src/pages/auth/SubscriptionPlan.jsx
import React, { useEffect, useState } from 'react';
import Button from '../../../components/forms/Button';
import AuthLayout from '../../../layouts/AuthLayout';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { loadStripe } from '@stripe/stripe-js';
import { toast } from 'react-toastify';
import checkIcon from '../../../assets/images/check.svg';
import closeIcon from '../../../assets/images/close.svg';
import { closeButtonSVG } from '../../../utils/svgIcons';

import Stripe from '../../../assets/images/stripe.png';
import Razorpay from '../../../assets/images/razorpay.png';

const SubscriptionPlan = () => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal related state
  const [showModal, setShowModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [selectedGateway, setSelectedGateway] = useState('stripe');
  const [isPaying, setIsPaying] = useState(false);

  const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLIC_KEY);

  useEffect(() => {
    document.body.classList.add('loginbg');
    return () => {
      document.body.classList.remove('loginbg');
    };
  }, []);

  useEffect(() => {
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

    fetchPlans();
  }, [navigate]);

  const handleSelectPlan = (plan) => {
    setSelectedPlan(plan);
    setShowModal(true);
  };

  const handlePay = async () => {
    if (!selectedPlan || !selectedGateway) {
      toast.warning('Please select a plan and a payment gateway.');
      return;
    }

    setIsPaying(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${process.env.REACT_APP_API_BASE_URL}/api/payments/create-payment`,
        {
          subscription_id: selectedPlan.id,
          amount: selectedPlan.price,
          gateway: selectedGateway,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (selectedGateway === 'stripe') {
        const stripe = await stripePromise;
        const result = await stripe.redirectToCheckout({ sessionId: response.data.sessionId });

        if (result.error) {
          toast.error(`Payment failed: ${result.error.message}`);
          console.error('Stripe checkout error:', result.error);
        }
      } else if (selectedGateway === 'razorpay') {
        console.log("Razorpay payment initiated:", response.data);
        toast.error('Razorpay integration not fully implemented in this example.');

      }
    } catch (err) {
      console.error('Payment initiation failed:', err);
      toast.error(err.response?.data?.message || 'Failed to start payment. Please try again.');

    } finally {
      setIsPaying(false);
      // Removed setShowModal(false) here, typically you'd close the modal
      // after successful payment redirection or a success message
      // and keep it open on failure for the user to try again.
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
                                    src={value ? checkIcon : closeIcon}
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
                      <Button onClick={() => handleSelectPlan(plan)} className="btn btn-info">
                        Select Plan
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Payment Gateway Selection Modal */}
      {showModal && selectedPlan && (
        <div className="modal-backdrop-custom d-block"> {/* Custom backdrop to cover screen */}
          <div className="modal-dialog-custom modal-dialog-centered"> {/* Custom dialog to match design width */}
            <div className="loginbg-w modal-content-custom"> {/* Reusing loginbg-w for modal content styling */}
              <div className="modal-header-custom">
                <h5 className="modal-title-custom">Select Payment Gateway</h5>
                <button type="button" className="close-button-custom" onClick={() => setShowModal(false)} aria-label="Close">
                  <img src={closeButtonSVG} className="img-fluid" alt="Close" />
                </button>
              </div>
              <div className="form-design modal-body-custom"> {/* Reusing form-design for content padding */}
                <div className="row g-3">
                  <div className="col-12">
                    <div className="form-check form-check-inline p-3 border rounded w-100 d-flex align-items-center justify-content-between">
                      <div>
                        <input
                          className="form-check-input"
                          type="radio"
                          name="gatewayOptions"
                          id="razorpayRadio"
                          value="razorpay"
                          checked={selectedGateway === 'razorpay'}
                          onChange={(e) => setSelectedGateway(e.target.value)}
                        />
                        <label className="form-check-label ms-2 fw-bold" htmlFor="razorpayRadio">
                          Razorpay
                        </label>
                      </div>
                      <img src={Razorpay} alt="Razorpay" height="24" />
                    </div>
                  </div>

                  <div className="col-12">
                    <div className="form-check form-check-inline p-3 border rounded w-100 d-flex align-items-center justify-content-between">
                      <div>
                        <input
                          className="form-check-input"
                          type="radio"
                          name="gatewayOptions"
                          id="stripeRadio"
                          value="stripe"
                          checked={selectedGateway === 'stripe'}
                          onChange={(e) => setSelectedGateway(e.target.value)}
                        />
                        <label className="form-check-label ms-2 fw-bold" htmlFor="stripeRadio">
                          Stripe
                        </label>
                      </div>
                      <img src={Stripe} alt="Stripe" height="24" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer-custom">
                <Button onClick={() => setShowModal(false)} className="btn btn-secondary me-2"> {/* Added me-2 for margin-right */}
                  Cancel
                </Button>
                <Button onClick={handlePay} disabled={isPaying} className="btn btn-info">
                  {isPaying ? 'Processing...' : 'Pay Now'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AuthLayout>
  );
};

export default SubscriptionPlan;
import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import AuthLayout from '../../../layouts/AuthLayout';

const PaymentSuccess = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = params.get('session_id');
  const fronttype = params.get('fronttype') || null; // ✅ default to null if missing
  const billingType = params.get('billingType'); // ✅ default to null if missing
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false); // ✅ to track verification failure

  useEffect(() => {
    const verifyPayment = async () => {
      if (sessionId) {
        try {
          const token = localStorage.getItem('token');
          const response = await axios.post(
            `${process.env.REACT_APP_API_BASE_URL}/api/payments/verify-stripe`,
            { session_id: sessionId, fronttype,billingType }, // ✅ send fronttype (can be null)
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          // ✅ Redirect based on fronttype
          setTimeout(() => {
            setLoading(false);
            if (response?.data?.fronttype === 'upgradePlan') {
              navigate('/billing');
            } else {
              navigate('/setup/setup-wizard');
            }
          }, 1000);

        } catch (err) {
          console.error('Payment verification failed:', err);
          setError(true);
          setLoading(false);
        }
      }
    };

    verifyPayment();
  }, [sessionId, fronttype, navigate]);

  return (
    <AuthLayout>
      <section className="subscription-sec">
        <div className="container text-center py-5">
          {loading ? (
            <div className="d-flex flex-column align-items-center">
              <div className="spinner-border text-primary mb-3" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="fw-medium fs-5">Verifying your payment, please wait...</p>
            </div>
          ) : error ? (
            <p className="text-danger">Something went wrong. Please contact support.</p>
          ) : null}
        </div>
      </section>
    </AuthLayout>
  );
};

export default PaymentSuccess;

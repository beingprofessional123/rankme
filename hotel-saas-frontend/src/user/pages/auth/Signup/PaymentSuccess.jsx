import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import AuthLayout from '../../../layouts/AuthLayout'; // Make sure this is correctly imported

const PaymentSuccess = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = params.get('session_id');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyPayment = async () => {
      if (sessionId) {
        try {
          const token = localStorage.getItem('token');
          await axios.post(
            `${process.env.REACT_APP_API_BASE_URL}/api/payments/verify-stripe`,
            { session_id: sessionId },
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          // Optionally add delay if needed
          setTimeout(() => {
            setLoading(false);
            navigate('/setup/setup-wizard'); // 👈 Enable redirect after verification
          }, 1000);

        } catch (err) {
          console.error('Payment verification failed:', err);
          setLoading(false); // Stop loading if error occurs
        }
      }
    };

    verifyPayment();
  }, [sessionId, navigate]);

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
          ) : (
            <p className="text-danger">Something went wrong. Please contact support.</p>
          )}
        </div>
      </section>
    </AuthLayout>
  );
};

export default PaymentSuccess;

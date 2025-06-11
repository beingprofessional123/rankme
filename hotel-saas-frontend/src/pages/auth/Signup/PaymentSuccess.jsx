import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const PaymentSuccess = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = params.get('session_id');

  useEffect(() => {
    const verifyPayment = async () => {
      if (sessionId) {
        try {
          const token = localStorage.getItem('token');
          await axios.post(`${process.env.REACT_APP_API_BASE_URL}/api/payments/verify-stripe`, {
            session_id: sessionId,
          }, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          // ✅ Redirect user to setup hotel info
          navigate('/setup/setup-wizard');
        } catch (err) {
          console.error('Payment verification failed:', err);
        }
      }
    };

    verifyPayment();
  }, [sessionId, navigate]);

  return <div className="text-center">Verifying your payment...</div>;
};

export default PaymentSuccess;

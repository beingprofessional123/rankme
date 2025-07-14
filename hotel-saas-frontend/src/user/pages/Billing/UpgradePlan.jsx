import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { Link, useNavigate, useParams, useLocation } from 'react-router-dom';
import axios from 'axios';
import moment from 'moment';
import Swal from 'sweetalert2';
import { loadStripe } from '@stripe/stripe-js';
import { toast } from 'react-toastify';

const UpgradePlan = () => {
    const navigate = useNavigate();
    const [plans, setPlans] = useState([]);
    const location = useLocation();
    const { subscription } = location.state || {};
    const [loading, setLoading] = useState(true);
    const { currentplanId } = useParams(); // planId will be '05461215-f8f0-4034-b3d3-cf3f9d4fdfab'
    const [upgradingPlanId, setUpgradingPlanId] = useState(null); // For loading state of selected plan
    const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLIC_KEY);

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
        } catch (err) {
            console.error('Error fetching subscription plans:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPlans();
    }, []);

    const UppdatePlan = async (planId, amount) => {

        if (!planId) {
            alert('Missing plan ID or price.');
            return;
        }

        setUpgradingPlanId(planId);

        const today = moment();
        const expiryDate = moment(subscription?.expires_at);
        const remainingDays = expiryDate.diff(today, 'days');

        const result = await Swal.fire({
            title: 'Are you sure?',
            html: `${
                isFinite(remainingDays)
                ? `You still have <strong>${remainingDays} day${remainingDays !== 1 ? 's' : ''}</strong> left in your current subscription.`
                : `You are currently on a <strong>Free Plan</strong> with unlimited time.`
            }<br><br>Do you want to upgrade now?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, upgrade now!',
        });


        if (result.isConfirmed) {
            let response;
            try {
                const token = localStorage.getItem('token');

                response = await axios.post(
                    `${process.env.REACT_APP_API_BASE_URL}/api/payments/upgrade-payment`,
                    {
                        subscription_id: planId,
                        amount: amount,
                        currency: 'INR',
                        gateway: 'stripe',
                        fronttype: 'upgradePlan',
                    },
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                if(response.data.billingType === 'free' && response.data.userSubscription.status === 'active'){
                    navigate('/billing');
                }

                const stripe = await stripePromise;
                const result = await stripe.redirectToCheckout({ sessionId: response.data.sessionId });
                if (result.error) {
                    toast.error(`Payment failed: ${result.error.message}`);
                    console.error('Stripe checkout error:', result.error);
                }
            } catch (err) {
                console.error('Error upgrading plan:', err);
                if(response.data.billingType !== 'free' && response.data.userSubscription.status !== 'active'){
                    Swal.fire('Error', 'Upgrade failed. Please try again.', 'error');
                }
            }
        }

        setUpgradingPlanId(null);
    };

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
                                        <li className="breadcrumb-item"><Link to='/billing'>Home</Link></li>
                                        <li className="breadcrumb-item active" aria-current="page">Upgrade Plan</li>
                                    </ol>
                                </nav>
                            </div>
                        </div>
                    </div>

                    <div className="planchoose-sec">
                        <div className="row">
                            {loading ? (
                                <div className='col-md-12 text-center'>
                                    <p>Loading plans...</p>
                                </div>
                            ) : (
                                plans.map(plan => (
                                    <div className="col-md-4" key={plan.id}>
                                        <div className="subscription-card">
                                            <div className="subscription-heading">
                                                <h2>{plan.name}</h2>
                                                <h6>${plan.price}/{plan.billing_period}</h6>
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
                                                {currentplanId === plan.id ? (
                                                    <button type="button" className="btn btn-info cancelbtn">
                                                        Selected
                                                    </button>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        className="btn btn-info"
                                                        onClick={() => UppdatePlan(plan.id, plan.price)}
                                                        disabled={upgradingPlanId === plan.id}
                                                    >
                                                        {upgradingPlanId === plan.id ? 'Processing...' : 'Select Plan'}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default UpgradePlan;

import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import moment from 'moment';
import Swal from 'sweetalert2';

const Billing = () => {
    const navigate = useNavigate();
    const [subscription, setSubscription] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

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

            setSubscription(response.data.results);
        } catch (err) {
            console.error('Error fetching user subscription:', err);
            setError('Failed to load your subscription plan.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUserSubscription();
    }, []);

    const handleCancelPlan = async () => {
        if (!subscription?.expires_at) {
            Swal.fire('Info', 'This is a free plan and cannot be cancelled.', 'info');
            return;
        }

        const now = moment();
        const expiresAt = moment(subscription.expires_at);
        const remainingDays = expiresAt.diff(now, 'days');

        const result = await Swal.fire({
            title: 'Are you sure?',
            text: `Do you really want to cancel your current subscription? It has ${remainingDays} day(s) remaining.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, cancel it!',
        });

        if (result.isConfirmed) {
            try {
                const token = localStorage.getItem('token');
                await axios.post(
                    `${process.env.REACT_APP_API_BASE_URL}/api/payments/cancel-payment`,
                    {},
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                Swal.fire('Cancelled!', 'Your subscription has been cancelled.', 'success');
                fetchUserSubscription(); // Refresh state

            } catch (error) {
                console.error('Cancel subscription error:', error);
                Swal.fire('Error', 'Failed to cancel the subscription. Please try again.', 'error');
            }
        }
    };


    const plan = subscription?.subscriptionPlan;

    return (
        <DashboardLayout>
            <div className="mainbody">
                <div className="container-fluid">
                    <div className="row breadcrumbrow">
                        <div className="col-md-6">
                            <div className="breadcrumb-sec">
                                <h2>Billing</h2>
                                <nav aria-label="breadcrumb">
                                    <ol className="breadcrumb">
                                        <li className="breadcrumb-item"><Link to='/billing'>Home</Link></li>
                                        <li className="breadcrumb-item active" aria-current="page">Billing</li>
                                    </ol>
                                </nav>
                            </div>
                        </div>
                        <div className="col-md-6">
                            <div className="breadcrumb-right">
                                <Link to='/invoice-history' className="btn btn-info">Invoice History</Link>
                            </div>
                        </div>
                    </div>

                    <div className="white-bg billingmain">
                        <div className="billing-heading">
                            <h2>Your Plan</h2>
                        </div>

                        {loading ? (
                            <div className='text-center'>
                                <p className='p-5'>Loading plans...</p>
                            </div>
                        ) : error ? (
                            <div className='text-center'>
                                <p className="text-danger p-5">{error}</p>
                            </div>

                        ) : (
                            <div className="billing-planmain">
                                <div className="billing-plan">
                                    <div className="billing-plan-name">
                                        <h3>
                                            <img src={`/user/images/billing-plan-icon.svg`} className="img-fluid" alt="" />
                                            {plan?.name || 'No Plan'}
                                        </h3>
                                        <p>Your current active subscription plan details.</p>
                                    </div>
                                    <div className="billing-plan-btn">

                                        <Link
                                            to={`/upgrade-plan/${plan?.id}`}
                                            state={{
                                                planId: plan?.id,
                                                planName: plan?.name,
                                                subscription: {
                                                    subscription_id: subscription?.subscription_id,
                                                    status: subscription?.status,
                                                    started_at: subscription?.started_at,
                                                    expires_at: subscription?.expires_at,
                                                }
                                            }}
                                            className="btn btn-info"
                                        >
                                            Upgrade Plan
                                        </Link>


                                        <div>
                                            <button
                                                type="button"
                                                className="btn btn-info cancelbtn"
                                                onClick={handleCancelPlan}
                                                disabled={plan?.billing_period === 'free'}
                                            >
                                                Cancel Plan
                                            </button>

                                        </div>
                                    </div>
                                </div>

                                <div className="billing-plan-info">
                                    <ul>
                                        <li><span>Plan</span><strong>{plan?.name}</strong></li>
                                        <li><span>Status</span><strong>{subscription?.status || 'N/A'}</strong></li>
                                        <li><span>Amount</span><strong>${plan?.price || 0}/{plan?.billing_period}</strong></li>
                                        <li><span>Subscription Since</span><strong>{moment(subscription?.started_at).format('MMMM D, YYYY')}</strong></li>
                                        <li><span>Subscription Renew</span><strong>{plan?.billing_period === 'free' ? '∞' : moment(subscription?.expires_at).format('MMMM D, YYYY')}</strong></li>
                                        <li><span>Payment Details</span><strong>**** **** **** ****</strong></li>
                                    </ul>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default Billing;

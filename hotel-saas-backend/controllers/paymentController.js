const { createStripePaymentIntent } = require('../services/stripeService');
const { createRazorpayOrder } = require('../services/razorpayService');
const { SubscriptionPlan, Payment, UserSubscription, User } = require('../models');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { Op } = require('sequelize'); // Required for filtering other subscriptions


exports.createPayment = async (req, res) => {
  try {
    const { subscription_id, amount, currency, gateway } = req.body;
    const user_id = req.user.id;
    const customerEmail = req.user.email;

    if (!subscription_id || amount === undefined || amount === null || !gateway) {
      return res.status(400).json({ message: 'Missing required fields.' });
    }


    const allowedGateways = ['stripe', 'razorpay'];
    if (!allowedGateways.includes(gateway)) {
      return res.status(400).json({ message: 'Invalid payment gateway.' });
    }

    // ✅ Find Subscription
    const subscription = await SubscriptionPlan.findOne({ where: { id: subscription_id } });
    if (!subscription) {
      return res.status(404).json({ message: 'Subscription plan not found.' });
    }

    let payment, session;
    const billingType = subscription.billing_period;

    if (billingType === 'free') {
      const userSubscription = await UserSubscription.create({
        user_id,
        subscription_id,
        status: 'active',
        started_at: new Date(),
        expires_at: null,
      });

      return res.status(201).json({
        message: 'Free subscription activated',
        userSubscription,
        billingType
      });
    }

    if (gateway === 'stripe') {
      // ✅ Create Stripe Checkout Session
      session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: currency || 'usd',
              product_data: {
                name: subscription.name,
              },
              unit_amount: Math.round(amount * 100), // in paisa
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        invoice_creation: {
          enabled: true, // ✅ Enable invoice generation
        },
        success_url: `${process.env.FRONTEND_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}&billingType=${billingType}`,
        cancel_url: `${process.env.FRONTEND_URL}/subscription-cancelled`,
        metadata: {
          user_id,
          subscription_id,
        },
        customer_email: customerEmail,
      });
      // ✅ Save payment with Stripe session ID
      payment = await Payment.create({
        user_id,
        subscription_id,
        amount,
        currency: currency || 'usd',
        gateway,
        status: 'pending',
        order_id: session.id,
      });

      const userSubscription = await UserSubscription.create({
        user_id,
        subscription_id,
        status: 'pending',
        started_at: null,
        expires_at: null,
      });

      return res.status(201).json({
        message: 'Stripe payment initialized',
        sessionId: session.id,
        userSubscription: userSubscription,
      });
    }

    // Razorpay placeholder
    // You can plug in Razorpay order creation here later

    return res.status(400).json({ message: 'Only Stripe gateway handled at this point.' });

  } catch (error) {
    console.error('Payment creation error:', error);
    return res.status(500).json({ message: 'Something went wrong', error: error.message });
  }
};

exports.verifyStripePayment = async (req, res) => {
  try {
    const { session_id, billingType, fronttype = null } = req.body;

    // 1. Get the Stripe session details
    const session = await stripe.checkout.sessions.retrieve(session_id);
    if (session.payment_status === 'paid') {
      let invoiceUrl = null;
      let invoice = null;
      console.log(billingType);

      if (billingType !== 'free') {
        const paymentIntent = await stripe.paymentIntents.retrieve(session.payment_intent);
        if (paymentIntent.invoice) {
          invoice = await stripe.invoices.retrieve(paymentIntent.invoice);
          invoiceUrl = invoice.hosted_invoice_url;
        } else {
          let customerId = session.customer;  // changed to `let`
          const amount = session.amount_total;
          const email = session.customer_email;

          try {
            if ((!customerId || customerId === '') && email) {
              const customers = await stripe.customers.list({
                email: email,
                limit: 1,
              });

              if (customers.data.length > 0) {
                customerId = customers.data[0].id;
              } else {
                // Create new customer with email
                const newCustomer = await stripe.customers.create({
                  email: email,
                  name: session.customer_details?.name || undefined,
                });
                customerId = newCustomer.id;
              }
            }

            if (!customerId) {
              throw new Error('Customer ID could not be determined.');
            }

            // 1. Create a draft invoice (force currency to 'usd')
            invoice = await stripe.invoices.create({
              customer: customerId,
              auto_advance: false,
              collection_method: 'charge_automatically',
              currency: 'usd',
              metadata: {
                created_for: 'manual_invoice_generation',
                payment_intent_id: paymentIntent.id,
              },
            });

            // 2. Add line item (also in USD)
            await stripe.invoiceItems.create({
              customer: customerId,
              amount: amount, // assuming amount is in USD cents
              currency: 'usd',
              description: 'One-time payment (manual invoice)',
              invoice: invoice.id,
            });

            // 3. Mark invoice as paid manually
            await stripe.invoices.pay(invoice.id, {
              paid_out_of_band: true,
            });

            // 4. Refresh invoice to get the URL
            invoice = await stripe.invoices.retrieve(invoice.id);
            invoiceUrl = invoice.hosted_invoice_url;

          } catch (invoiceErr) {
            console.warn('Invoice generation skipped:', invoiceErr.message);
            invoiceUrl = null;
          }
        }
      }

      // 2. Update Payment status to 'success'
      await Payment.update(
        {
          status: 'success',
          payment_id: session.payment_intent,
          invoice_url: invoiceUrl,
        },
        {
          where: { order_id: session.id },
        }
      );

      // 3. Fetch updated payment manually (MySQL workaround)
      const updatedPayment = await Payment.findOne({
        where: { order_id: session.id },
      });

      if (!updatedPayment) {
        return res.status(404).json({ message: 'Payment record not found.' });
      }

      const { user_id, subscription_id } = updatedPayment;

      // 4. Fetch subscription plan
      const plan = await SubscriptionPlan.findByPk(subscription_id);
      if (!plan) {
        return res.status(404).json({ message: 'Subscription plan not found.' });
      }

      // 5. Find pending subscription
      const userSubscription = await UserSubscription.findOne({
        where: {
          user_id,
          subscription_id,
          status: 'pending',
        },
      });

      if (!userSubscription) {
        return res.status(404).json({ message: 'User subscription record not found.' });
      }

      // Delete other subscriptions
      await UserSubscription.destroy({
        where: {
          user_id,
          id: { [Op.ne]: userSubscription.id },
        },
      });

      // 6. Set start and expiry
      const startedAt = new Date();
      let expiresAt = new Date(startedAt);

      if (plan.billing_period === 'monthly') {
        expiresAt.setMonth(expiresAt.getMonth() + 1);
      } else if (plan.billing_period === 'yearly') {
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);
      } else if (plan.billing_period === 'free') {
        expiresAt = null;
      } else {
        return res.status(400).json({ message: 'Invalid billing period.' });
      }

      // 7. Activate subscription
      await userSubscription.update({
        started_at: startedAt,
        expires_at: expiresAt,
        status: 'active',
      });

      return res.status(200).json({
        message: 'Payment successful and subscription activated',
        fronttype,
      });
    }

    return res.status(400).json({ message: 'Payment not completed' });

  } catch (error) {
    console.error('Stripe payment verify error:', error);
    return res.status(500).json({
      message: 'Payment verification failed',
      error: error.message,
    });
  }
};

exports.upgradePayment = async (req, res) => {
  try {
    const { subscription_id, amount, currency, gateway, fronttype } = req.body;
    const user_id = req.user.id;
    const customerEmail = req.user.email;


    if (!subscription_id || amount === undefined || amount === null || !gateway) {
      return res.status(400).json({ message: 'Missing required fields.' });
    }

    const allowedGateways = ['stripe', 'razorpay'];
    if (!allowedGateways.includes(gateway)) {
      return res.status(400).json({ message: 'Invalid payment gateway.' });
    }

    // ✅ Find Subscription
    const subscription = await SubscriptionPlan.findOne({ where: { id: subscription_id } });
    if (!subscription) {
      return res.status(404).json({ message: 'Subscription plan not found.' });
    }

    let payment, session;
    const billingType = subscription.billing_period;

    if (billingType === 'free') {
      const userSubscription = await UserSubscription.create({
        user_id,
        subscription_id,
        status: 'active',
        started_at: new Date(),
        expires_at: null,
      });

      return res.status(201).json({
        message: 'Free subscription activated',
        userSubscription,
        billingType
      });
    }
    
    if (gateway === 'stripe') {
      // ✅ Create Stripe Checkout Session
      session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: currency || 'usd',
              product_data: {
                name: subscription.name,
              },
              unit_amount: Math.round(amount * 100), // in paisa
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${process.env.FRONTEND_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}&fronttype=${fronttype}&billingType=${billingType}`,
        cancel_url: `${process.env.FRONTEND_URL}/subscription-cancelled`,
        metadata: {
          user_id,
          subscription_id,
        },
        customer_email: customerEmail,
      });
      // ✅ Save payment with Stripe session ID
      payment = await Payment.create({
        user_id,
        subscription_id,
        amount,
        currency: currency || 'usd',
        gateway,
        status: 'pending',
        order_id: session.id,
      });

      const userSubscription = await UserSubscription.create({
        user_id,
        subscription_id,
        status: 'pending',
        started_at: null,
        expires_at: null,
      });

      return res.status(201).json({
        message: 'Stripe payment initialized',
        sessionId: session.id,
        userSubscription: userSubscription,
      });
    }

    // Razorpay placeholder
    // You can plug in Razorpay order creation here later

    return res.status(400).json({ message: 'Only Stripe gateway handled at this point.' });

  } catch (error) {
    console.error('Payment creation error:', error);
    return res.status(500).json({ message: 'Something went wrong', error: error.message });
  }
};

exports.cancelPayment = async (req, res) => {
  try {
    const user_id = req.user.id;

    // 1. Find active subscription
    const activeSubscription = await UserSubscription.findOne({
      where: {
        user_id,
        status: 'active',
      },
    });

    if (!activeSubscription) {
      return res.status(404).json({ message: 'No active subscription found to cancel.' });
    }

    // 2. Delete the current active subscription
    await activeSubscription.destroy();

    // 3. Find Free plan
    const freePlan = await SubscriptionPlan.findOne({
      where: { billing_period: 'free' },
    });

    if (!freePlan) {
      return res.status(500).json({ message: 'Free plan not configured in the system.' });
    }

    // 4. Assign Free plan to user
    const newFreeSub = await UserSubscription.create({
      user_id,
      subscription_id: freePlan.id,
      status: 'active',
      started_at: new Date(),
      expires_at: null, // ✅ Free plan never expires
    });

    return res.status(200).json({
      message: 'Plan cancelled and user switched to free plan.',
      newPlan: {
        id: freePlan.id,
        name: freePlan.name,
      },
    });

  } catch (error) {
    console.error('Cancel plan error:', error);
    return res.status(500).json({
      message: 'Something went wrong while cancelling the plan.',
      error: error.message,
    });
  }
};

exports.listPayment = async (req, res) => {
  try {
    const user_id = req.user.id;

    // ✅ Fetch all payments with amount > 0 and include subscription info
    const payments = await Payment.findAll({
      where: {
        user_id,
        amount: {
          [Op.gt]: 0, // only payments greater than 0
        },
      },
      include: [
        {
          model: SubscriptionPlan,
          attributes: ['name', 'price', 'billing_period'],
        },
        {
          model: User,
          attributes: ['name'], // ✅ Ensure name is fetched
        },
      ],
      order: [['createdAt', 'DESC']], // Most recent first
    });

    return res.status(200).json({
      message: 'Payments fetched successfully',
      results: payments,
    });

  } catch (error) {
    console.error('Error fetching payment history:', error);
    return res.status(500).json({
      message: 'Failed to retrieve payment history',
      error: error.message,
    });
  }
};


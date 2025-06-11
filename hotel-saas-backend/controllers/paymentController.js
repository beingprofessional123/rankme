const { createStripePaymentIntent } = require('../services/stripeService');
const { createRazorpayOrder } = require('../services/razorpayService');
const { SubscriptionPlan, Payment, UserSubscription  } = require('../models');

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
exports.createPayment = async (req, res) => {
  try {
    const { subscription_id, amount, currency, gateway } = req.body;
    const user_id = req.user.id;

    if (!subscription_id || !amount || !gateway) {
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

    if (gateway === 'stripe') {
      // ✅ Create Stripe Checkout Session
      session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: currency || 'INR',
              product_data: {
                name: subscription.name,
              },
              unit_amount: Math.round(amount * 100), // in paisa
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${process.env.FRONTEND_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.FRONTEND_URL}/subscription-cancelled`,
        metadata: {
          user_id,
          subscription_id,
        },
      });

      // ✅ Save payment with Stripe session ID
      payment = await Payment.create({
        user_id,
        subscription_id,
        amount,
        currency: currency || 'INR',
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
    const { session_id } = req.body;

    // 1. Get the Stripe session details
    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (session.payment_status === 'paid') {
      // 2. Update Payment status to 'success'
      const [updatedCount, [updatedPayment]] = await Payment.update(
        {
          status: 'success',
          payment_id: session.payment_intent,
        },
        {
          where: { order_id: session.id },
          returning: true,
        }
      );

      if (!updatedPayment) {
        return res.status(404).json({ message: 'Payment record not found.' });
      }

      const { user_id, subscription_id } = updatedPayment;

      // 3. Fetch the subscription plan to get billing period
      const plan = await SubscriptionPlan.findByPk(subscription_id);
      if (!plan) {
        return res.status(404).json({ message: 'Subscription plan not found.' });
      }

      // 4. Find existing pending UserSubscription
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

      // 5. Calculate expiry date based on billing period
      const startedAt = new Date();
      const expiresAt = new Date(startedAt);

      if (plan.billing_period === 'monthly') {
        expiresAt.setMonth(expiresAt.getMonth() + 1);
      } else if (plan.billing_period === 'yearly') {
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);
      } else {
        return res.status(400).json({ message: 'Invalid billing period.' });
      }

      // 6. Update the UserSubscription
      await userSubscription.update({
        started_at: startedAt,
        expires_at: expiresAt,
        status: 'active',
      });

      return res.status(200).json({ message: 'Payment successful and subscription activated' });
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


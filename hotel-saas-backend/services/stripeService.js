const stripe = require('../config/stripe');

exports.createStripePaymentIntent = async ({ amount, currency, userId }) => {
  const paymentIntent = await stripe.paymentIntents.create({
    amount: amount * 100, // amount in smallest currency unit
    currency,
    metadata: { userId },
  });

  return paymentIntent.client_secret;
};

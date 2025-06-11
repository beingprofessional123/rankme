const razorpay = require('../config/razorpay');
const crypto = require('crypto');

exports.createRazorpayOrder = async ({ amount, currency }) => {
  const order = await razorpay.orders.create({
    amount: amount * 100,
    currency,
    payment_capture: 1,
  });

  return order;
};

exports.verifyRazorpaySignature = ({ razorpay_order_id, razorpay_payment_id, razorpay_signature }) => {
  const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_SECRET_KEY);
  hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
  const digest = hmac.digest("hex");
  return digest === razorpay_signature;
};

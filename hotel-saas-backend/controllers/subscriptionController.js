// controllers/subscriptionController.js
const { SubscriptionPlan } = require('../models');

exports.getAllSubscriptions = async (req, res) => {
  try {
    const plans = await SubscriptionPlan.findAll();
    res.json(plans);
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

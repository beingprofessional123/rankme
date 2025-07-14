// controllers/subscriptionController.js
const { UserSubscription, SubscriptionPlan, Hotel } = require('../models');

exports.getAllSubscriptions = async (req, res) => {
  try {
    const plans = await SubscriptionPlan.findAll();
    res.json(plans);
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getUserSubscriptions = async (req, res) => {
  try {
    const user_id = req.user.id;
    const company_id = req.user.company_id;

    const subscription = await UserSubscription.findOne({
      where: { user_id },
      include: [
        {
          model: SubscriptionPlan,
          as: 'subscriptionPlan', // ✅ must match the alias
          attributes: ['id', 'name', 'price', 'billing_period', 'features'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    // ✅ Check if hotel data exists for this user
    const hotel = await Hotel.findOne({
      where: { company_id }, // adjust this if your Hotel model uses company_id instead
    });

    res.status(200).json({
      status: 'success',
      status_code: 200,
      status_message: 'OK',
      message: 'User subscription fetched successfully',
      results: subscription,
      hotelExists: !!hotel
    });
  } catch (error) {
    console.error('Error fetching user subscription:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch user subscription',
      error: error.message,
    });
  }
};


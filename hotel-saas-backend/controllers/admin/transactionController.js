const { Payment, User, SubscriptionPlan } = require('../../models');

const transactionController = {
  // GET /api/admin/transaction/list
  getallTransaction: async (req, res) => {
    try {
      const transactions = await Payment.findAll({
        include: [
          {
            model: User,
            attributes: ['id', 'name', 'email', 'phone']
          },
          {
            model: SubscriptionPlan,
            attributes: ['id', 'name', 'price']
          }
        ],
        order: [['createdAt', 'DESC']]
      });

      const formattedTransactions = transactions.map(txn => ({
        id: txn.id,
        userName: txn.User?.name || 'N/A',
        userEmail: txn.User?.email || 'N/A',
        userPhone: txn.User?.phone || 'N/A',
        subscriptionName: txn.SubscriptionPlan?.name || 'N/A',
        subscriptionPrice: txn.SubscriptionPlan?.price || 'N/A',
        amount: txn.amount,
        currency: txn.currency,
        status: txn.status,
        gateway: txn.gateway,
        payment_id: txn.payment_id,
        order_id: txn.order_id,
        invoice_url: txn.invoice_url,
        createdAt: txn.createdAt
      }));

      res.status(200).json({
        status: 'success',
        status_code: 200,
        status_message: 'OK',
        message: 'Transactions fetched successfully',
        results: formattedTransactions
      });
    } catch (error) {
      console.error('Error fetching transactions:', error);
      res.status(500).json({
        status: 'error',
        status_code: 500,
        status_message: 'INTERNAL_SERVER_ERROR',
        message: 'Error fetching transactions',
        results: null
      });
    }
  }
};

module.exports = transactionController;

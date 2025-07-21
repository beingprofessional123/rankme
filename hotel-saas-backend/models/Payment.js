// models/Payment.js
module.exports = (sequelize, DataTypes) => {
  const Payment = sequelize.define('Payment', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    subscription_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    currency: {
      type: DataTypes.STRING(10),
      defaultValue: 'usd',
    },
    status: {
      type: DataTypes.STRING(20),
      defaultValue: 'pending',
      validate: {
        isIn: [['pending', 'success', 'failed']],
      },
    },
    gateway: {
      type: DataTypes.STRING(20),
      allowNull: false,
      validate: {
        isIn: [['stripe', 'razorpay']],
      },
    },
    payment_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    order_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    invoice_url: {
      type: DataTypes.STRING,
      allowNull: true,
    }

  }, {
    timestamps: true,
  });

  Payment.associate = function(models) {
    Payment.belongsTo(models.User, { foreignKey: 'user_id' });
    Payment.belongsTo(models.SubscriptionPlan, { foreignKey: 'subscription_id' });
  };

  return Payment;
};

// models/UserSubscription.js
module.exports = (sequelize, DataTypes) => {
  const UserSubscription = sequelize.define('UserSubscription', {
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
    started_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING(20),
      defaultValue: 'pending',
      validate: {
        isIn: [['pending', 'active', 'expired', 'cancelled']],
      },
    },
  }, {
    timestamps: true,
  });

  UserSubscription.associate = function(models) {
    UserSubscription.belongsTo(models.User, { foreignKey: 'user_id', as: 'user'});
    UserSubscription.belongsTo(models.SubscriptionPlan, { foreignKey: 'subscription_id',as: 'subscriptionPlan' });
  };
  return UserSubscription;
};

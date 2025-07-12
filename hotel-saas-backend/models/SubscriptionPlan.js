module.exports = (sequelize, DataTypes) => {
  const SubscriptionPlan = sequelize.define('SubscriptionPlan', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: DataTypes.STRING,
    price: DataTypes.FLOAT,
    billing_period: {
      type: DataTypes.ENUM('free','monthly', 'yearly'),
      allowNull: false,
      defaultValue: 'free',
    }, 
    features: DataTypes.JSONB, // or TEXT if storing as plain string
  });

  SubscriptionPlan.associate = (models) => {
    SubscriptionPlan.hasMany(models.Company, { foreignKey: 'subscription_plan_id' });
    SubscriptionPlan.hasMany(models.UserSubscription, { foreignKey: 'subscription_id' }); // ✅ Add this
  };


  return SubscriptionPlan;
};

module.exports = (sequelize, DataTypes) => {
  const Company = sequelize.define('Company', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: DataTypes.STRING,
    contact_email: DataTypes.STRING,
    contact_phone: DataTypes.STRING,
    logo_url: DataTypes.STRING
  });

  Company.associate = (models) => {
    Company.hasMany(models.User, { foreignKey: 'company_id' });
    Company.hasMany(models.Hotel, { foreignKey: 'company_id' });
    Company.belongsTo(models.SubscriptionPlan, { foreignKey: 'subscription_plan_id' });
  };

  return Company;
};

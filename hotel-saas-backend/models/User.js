module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: DataTypes.STRING,
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    phone: DataTypes.STRING,
    password: DataTypes.STRING,
    role: {
      type: DataTypes.ENUM('super_admin', 'company_admin', 'revenue_manager', 'general_manager', 'analyst'),
      defaultValue: 'company_admin',
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    }
  });

  User.associate = (models) => {
    User.belongsTo(models.Company, { foreignKey: 'company_id' });
  };

  return User;
};

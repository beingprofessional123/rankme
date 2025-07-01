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
    countryCodeid: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'country', // 👈 matches Country's tableName
        key: 'id',
      },
    },
    password: DataTypes.STRING,
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    reset_password_token: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    reset_password_expires: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    company_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'Companies',
        key: 'id',
      },
    },
    profile: {
      type: DataTypes.STRING,
      allowNull: true
    },
    // New: Foreign key for Role
    role_id: {
      type: DataTypes.UUID,
      allowNull: false, // Assuming every user must have a role
      references: {
        model: 'Roles', // Name of the table for the Role model
        key: 'id',
      },
    },
  });

  User.associate = (models) => {
    User.belongsTo(models.Company, { foreignKey: 'company_id' });
    User.belongsTo(models.Role, { foreignKey: 'role_id' });
    User.belongsTo(models.Country, { foreignKey: 'countryCodeid', as: 'Country' });




  };

  return User;
};
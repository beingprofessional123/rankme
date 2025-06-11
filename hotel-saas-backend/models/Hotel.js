// src/models/Hotel.js
module.exports = (sequelize, DataTypes) => {
  const Hotel = sequelize.define('Hotel', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: DataTypes.STRING,
    location: DataTypes.STRING,
    hotel_type: DataTypes.STRING,
    // It's good practice to also define foreign keys as columns in the model,
    // even if they are defined in associations. Make sure this matches your DB schema.
    company_id: {
      type: DataTypes.UUID,
      allowNull: true, // or false if always required
    },
  });

  Hotel.associate = (models) => {
    // Add 'as' aliases here
    Hotel.belongsTo(models.Company, { foreignKey: 'company_id', as: 'Company' }); // Added 'as'
    Hotel.hasMany(models.RoomType, { foreignKey: 'hotel_id', as: 'RoomTypes' }); // ADDED 'as'
    Hotel.hasMany(models.RateCategory, { foreignKey: 'hotel_id', as: 'RateCategories' }); // ADDED 'as'
  };

  return Hotel;
};
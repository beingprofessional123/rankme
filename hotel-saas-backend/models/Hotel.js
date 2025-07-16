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
    company_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    total_rooms: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
  });

  Hotel.associate = (models) => {
    Hotel.belongsTo(models.Company, { foreignKey: 'company_id', as: 'Company' });
    Hotel.hasMany(models.RoomType, { foreignKey: 'hotel_id', as: 'RoomTypes' });
    Hotel.hasMany(models.RateCategory, { foreignKey: 'hotel_id', as: 'RateCategories' });
    
    // CHANGE THIS LINE for the ScrapeSourceHotel association (hasMany -> hasOne)
    Hotel.hasOne(models.ScrapeSourceHotel, {
      foreignKey: 'hotel_id',
      as: 'ScrapeSourceHotel', // Use singular alias for hasOne relationships
      onDelete: 'CASCADE', // Optional: If the Hotel is deleted, also delete its associated ScrapeSourceHotel
    });
  };

  return Hotel;
};
module.exports = (sequelize, DataTypes) => {
  const RateCategory = sequelize.define('RateCategory', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: DataTypes.STRING,
    description: DataTypes.TEXT,

    // ✅ Add hotel_id field here
    hotel_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  });

  RateCategory.associate = (models) => {
    RateCategory.belongsTo(models.Hotel, { foreignKey: 'hotel_id' });
    RateCategory.hasMany(models.RoomType, { foreignKey: 'rate_category_id' });
  };

  return RateCategory;
};

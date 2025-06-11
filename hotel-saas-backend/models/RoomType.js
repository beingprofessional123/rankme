module.exports = (sequelize, DataTypes) => {
  const RoomType = sequelize.define('RoomType', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: DataTypes.STRING,
    capacity: DataTypes.INTEGER
  });

  RoomType.associate = (models) => {
    RoomType.belongsTo(models.Hotel, { foreignKey: 'hotel_id' });
    RoomType.belongsTo(models.RateCategory, { foreignKey: 'rate_category_id' });
  };

  return RoomType;
};

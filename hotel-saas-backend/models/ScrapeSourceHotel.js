// src/models/ScrapeSourceHotel.js
module.exports = (sequelize, DataTypes) => {
  const ScrapeSourceHotel = sequelize.define('ScrapeSourceHotel', {
    uuid: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    hotel_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Hotels', // This refers to the table name of the Hotel model
        key: 'id',       // This refers to the primary key of the Hotel model
      },
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'Users', // This refers to the table name of the User model
        key: 'id',      // This refers to the primary key of the User model
      },
    },
    source_hotel_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    source_type: { // 'Booking.com', 'Expedia', etc.
      type: DataTypes.STRING,
      allowNull: false,
    },  
  }, {
    tableName: 'ScrapeSourceHotel',
    timestamps: true,
    underscored: true,
    // Add a compound unique index to ensure that a single hotel_id
  });

  ScrapeSourceHotel.associate = (models) => {
    // A ScrapeSourceHotel belongs to one Hotel
    ScrapeSourceHotel.belongsTo(models.Hotel, {
      foreignKey: 'hotel_id',
      as: 'Hotel',
    });

    // A ScrapeSourceHotel belongs to one User
    ScrapeSourceHotel.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'User',
    });
  };

  return ScrapeSourceHotel;
};
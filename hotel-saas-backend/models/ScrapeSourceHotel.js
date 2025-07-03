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
      unique: true, // <--- THIS IS THE KEY CHANGE: Ensures only one ScrapeSourceHotel per hotel_id
      references: {
        model: 'Hotels', // This refers to the table name of the Hotel model
        key: 'id',       // This refers to the primary key of the Hotel model
      },
    },
    user_id: { // <--- NEW FIELD: user_id
      type: DataTypes.UUID,
      allowNull: true, // Assuming a ScrapeSourceHotel might not always be associated with a user, or can be null initially
      references: {
        model: 'Users', // This refers to the table name of the User model
        key: 'id',       // This refers to the primary key of the User model
      },
    },
    source_hotel_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    source_type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  }, {
    tableName: 'ScrapeSourceHotel',
    timestamps: true,
    underscored: true,
  });

  ScrapeSourceHotel.associate = (models) => {
    // A ScrapeSourceHotel belongs to one Hotel
    ScrapeSourceHotel.belongsTo(models.Hotel, {
      foreignKey: 'hotel_id',
      as: 'Hotel', // Alias for when you include the Hotel model
    });

    // A ScrapeSourceHotel belongs to one User
    ScrapeSourceHotel.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'User', // Alias for when you include the User model
    });
  };

  return ScrapeSourceHotel;
};
// src/models/Config.js
module.exports = (sequelize, DataTypes) => {
  const Config = sequelize.define('Config', {
    key: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      primaryKey: true,
    },
    value: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  }, {
    tableName: 'config',
    timestamps: false, // Add this line to disable timestamps
  });

  return Config;
};
// models/Country.js
module.exports = (sequelize, DataTypes) => {
  const Country = sequelize.define('Country', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    short_name: {
      type: DataTypes.STRING(5),
      allowNull: false,
      unique: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    phonecode: {
      type: DataTypes.STRING(20),
      allowNull: true
    }
  }, {
    tableName: 'country',
    timestamps: false
  });

  return Country;
};

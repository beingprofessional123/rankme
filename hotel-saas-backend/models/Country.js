module.exports = (sequelize, DataTypes) => {
  const Country = sequelize.define('Country', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    short_name: {
      type: DataTypes.STRING(5),
      allowNull: false,
      unique: true,
      validate: {
        len: [2, 5],
      },
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    phonecode: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
  }, {
    tableName: 'country', // 👈 Ensures Sequelize uses lowercase table name
    timestamps: false,
    underscored: true, // Optional: if you're using snake_case column names
  });

  Country.associate = (models) => {
    Country.hasMany(models.User, {
      foreignKey: 'countryCodeid',
      as: 'User',
    });
  };

  return Country;
};

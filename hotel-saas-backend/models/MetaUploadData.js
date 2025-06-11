// src/models/metauploaddata.js

module.exports = (sequelize, DataTypes) => {
  const MetaUploadData = sequelize.define('MetaUploadData', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    uploadDataId: { // Link to main UploadData record
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'UploadData', // Table name of UploadData model
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    userId: { // Denormalized for easier querying if needed
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    dataSourceName: {
      type: DataTypes.STRING,
      allowNull: true, // Can be null if not always provided
    },
    hotelPropertyId: { // Foreign key to Hotels table (assuming Hotels model exists)
      type: DataTypes.UUID,
      allowNull: true, // Or false if always required
      references: {
        model: 'Hotels', // Replace with your actual Hotels table name if different
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL', // Or CASCADE, depending on your business logic
    },
    fromDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    toDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
  }, {
    timestamps: true,
  });

  MetaUploadData.associate = (models) => {
    MetaUploadData.belongsTo(models.UploadData, { foreignKey: 'uploadDataId' });
    MetaUploadData.belongsTo(models.User, { foreignKey: 'userId' });
    MetaUploadData.belongsTo(models.Hotel, { foreignKey: 'hotelPropertyId', as: 'hotelProperty' }); // Assuming Hotel model
  };

  return MetaUploadData;
};
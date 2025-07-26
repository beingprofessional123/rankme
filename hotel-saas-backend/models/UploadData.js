// src/models/uploaddata.js

module.exports = (sequelize, DataTypes) => {
  const UploadData = sequelize.define('UploadData', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    userId: { // Who uploaded the file
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Users', // This is the table name
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    companyId: { // To which company this upload belongs
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Companies', // This is the table name
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    originalFileName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    filePath: { // Optional: if you store files on disk/S3
      type: DataTypes.STRING,
      allowNull: true,
    },
    fileType: { // booking, competitor, str/ocr report
      type: DataTypes.ENUM('booking', 'competitor', 'str_ocr_report', 'property_price_data'),
      allowNull: false,
    },
    plateform: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    status: { // e.g., 'uploaded', 'processing', 'extracted', 'saved', 'failed'
      type: DataTypes.ENUM('uploaded', 'processing', 'extracted', 'saved', 'failed', 'partially_extracted_with_errors'),
      defaultValue: 'uploaded',
      allowNull: false,
    },
  }, {
    timestamps: true, // createdAt, updatedAt
  });

  UploadData.associate = (models) => {
    UploadData.belongsTo(models.User, { foreignKey: 'userId', as: 'uploader' });
    UploadData.belongsTo(models.Company, { foreignKey: 'companyId' });
    UploadData.hasOne(models.MetaUploadData, { foreignKey: 'uploadDataId', as: 'metaData' });
    UploadData.hasMany(models.UploadedExtractDataFile, { foreignKey: 'uploadDataId', as: 'extractedFiles' });
  };

  return UploadData;
};
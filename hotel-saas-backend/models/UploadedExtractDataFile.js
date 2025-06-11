// src/models/uploadedextractdatafile.js

module.exports = (sequelize, DataTypes) => {
  const UploadedExtractDataFile = sequelize.define('UploadedExtractDataFile', {
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

    // Data fields extracted from the file (e.g., booking data fields)
    checkIn: {
      type: DataTypes.DATEONLY,
      allowNull: true, // Allow null for validation purposes later, or set to false if critical
      validate: {
        isDate: true,
      },
    },
    checkOut: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      validate: {
        isDate: true,
      },
    },
    roomType: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    rate: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      validate: {
        isDecimal: true,
        min: 0,
      },
    },
    source: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    competitorHotel: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      validate: {
        isDate: true,
      },
    },
    reportType: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    occupancy: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    adrUsd: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    revParUsd: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    // Field to track if this row had validation issues
    isValid: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
    },
    validationErrors: { // Store JSON string of errors for this specific row
      type: DataTypes.TEXT,
      allowNull: true,
      get() {
        const rawValue = this.getDataValue('validationErrors');
        return rawValue ? JSON.parse(rawValue) : [];
      },
      set(value) {
        this.setDataValue('validationErrors', JSON.stringify(value));
      },
    },
  }, {
    timestamps: true,
  });

  UploadedExtractDataFile.associate = (models) => {
    UploadedExtractDataFile.belongsTo(models.UploadData, { foreignKey: 'uploadDataId' });
    UploadedExtractDataFile.belongsTo(models.User, { foreignKey: 'userId' });
  };

  return UploadedExtractDataFile;
};
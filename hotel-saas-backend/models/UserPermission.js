module.exports = (sequelize, DataTypes) => {
  const UserPermission = sequelize.define('UserPermission', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    module_key: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    permission_key: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    is_allowed: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  }, {
    tableName: 'UserPermission',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['user_id', 'module_key', 'permission_key']
      }
    ]
  });

  UserPermission.associate = (models) => {
    UserPermission.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user'
    });
  };

  return UserPermission;
};

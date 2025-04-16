const { DataTypes } = require('sequelize');
const { sequelize } = require('./index');

const Event = sequelize.define('Event', {
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  datetime: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  location: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  invitedUserIds: {
    type: DataTypes.ARRAY(DataTypes.INTEGER),
    allowNull: true,
    defaultValue: [],
  },
  conformedUserIds: {
    type: DataTypes.ARRAY(DataTypes.INTEGER),
    allowNull: true,
    defaultValue: [],
  },
  description: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: '',
  }
});

Event.associate = (models) => {
  Event.belongsTo(models.User, { foreignKey: 'userId' });
};

module.exports = Event;

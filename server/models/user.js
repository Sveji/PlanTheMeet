const { DataTypes } = require('sequelize');
const { sequelize } = require('./index');

const User = sequelize.define('User', {
  googleId: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: true,
  },
  firstName: DataTypes.STRING,
  familyName: DataTypes.STRING,
  email: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: true,   
  },
  photo: DataTypes.STRING,
  friends: {
    type: DataTypes.ARRAY(DataTypes.INTEGER),
    defaultValue: [],
  },
});

module.exports = User;

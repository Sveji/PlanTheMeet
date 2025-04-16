const { DataTypes } = require('sequelize');
const { sequelize } = require('./index');

const FriendRequest = sequelize.define('FriendRequest', {
    requesterId: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    recipientId: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    status: {  // 'pending', 'accepted', 'rejected'
        type: DataTypes.STRING,
        defaultValue: 'pending',
    }
});

FriendRequest.associate = (models) => {
    FriendRequest.belongsTo(models.User, { foreignKey: 'requesterId', as: 'requester' });
    FriendRequest.belongsTo(models.User, { foreignKey: 'recipientId', as: 'recipient' });
};

module.exports = FriendRequest;

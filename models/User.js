const {Sequelize, DataTypes} = require('sequelize')
const sequelize = require('./index');
const Room = require('./Room');

const User = sequelize.define('User', {
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    phoneNumber: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    }
});

User.belongsToMany(Room, {
    through: 'UserRoom'
})

(async () => {
    await User.sync().then(() => {
        console.log('Room is synced successfully')
    })
})().catch(err => {
    console.log({err})
})

module.exports = User;
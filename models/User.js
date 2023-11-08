const {Sequelize, DataTypes} = require('sequelize')
const sequelize = require('./index');

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

module.exports = User;
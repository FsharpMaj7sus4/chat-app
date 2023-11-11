const {Sequelize, DataTypes} = require('sequelize')
const sequelize = require('./index');
const User = require('./User');

console.log({sequelize})

const Room = sequelize.define('Room', {
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
});

Room.belongsToMany(User, {
    through: 'UserRoom'
})

(async () => {
    await Room.sync().then(async () => {
        console.log('Room is synced successfully')
        const [room, createdRoom] = await Room.findOrCreate({
            where: { name: 'global' },
            defaults: {
              name: 'global'
            }
          });
    });
})().catch(err => {
    console.log({err})
})

module.exports = Room;
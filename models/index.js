const Sequelize = require("sequelize")
const defineUser = require("./User")
const defineRoom = require("./Room")
const defineMessage = require('./Message')

const { DB_DB, DB_USERNAME, DB_PASSWORD, DB_PORT, DB_HOST, DB_DIALECT } =
  process.env

const sequelize = new Sequelize(DB_DB, DB_USERNAME, DB_PASSWORD, {
  port: DB_PORT, // Your database port
  logging: false,
  host: DB_HOST,
  dialect: DB_DIALECT,
})

const db = {}

db.User = defineUser(Sequelize, sequelize)
db.Room = defineRoom(Sequelize, sequelize)
db.Message = defineMessage(Sequelize, sequelize)

db.Room.belongsToMany(db.User, {
  through: "UserRoom",
})

db.User.belongsToMany(db.Room, {
  through: "UserRoom",
})

db.User.hasMany(db.Message, {
  foreignKey: {
    name: 'senderId'
  }
})

db.Message.belongsTo(db.User, {
  foreignKey: {
    name: 'senderId'
  }
});

db.Room.hasMany(db.Message);

db.Message.belongsTo(db.Room);

db.Message.hasOne(db.Message, {
  as: "repliedTo"
})

db.Sequelize = Sequelize
db.sequelize = sequelize

module.exports = db

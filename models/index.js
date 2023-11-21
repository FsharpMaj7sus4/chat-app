const Sequelize = require("sequelize")
const defineUser = require("./User")
const defineRoom = require("./Room")
const defineMessage = require('./Message')
const defineFile = require('./file')

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
db.File = defineFile(Sequelize, sequelize)

db.Room.belongsToMany(db.User, {
  through: "UserRoom",
})
db.User.belongsToMany(db.Room, {
  through: "UserRoom",
})

db.User.hasMany(db.Message, {
  as: 'sender',
  foreignKey: 'senderId'
})
db.Message.belongsTo(db.User, {
  as: 'sender',
  foreignKey: 'senderId'
})

db.Room.hasMany(db.Message)
db.Message.belongsTo(db.Room)

db.Message.hasMany(db.Message, {
  as: "reply",
  foreignKey: 'repliedToId'
})
db.Message.belongsTo(db.Message, {
  as: "repliedTo",
  foreignKey: 'repliedToId'
})

db.Message.belongsTo(db.File)
db.File.hasOne(db.Message)

db.Sequelize = Sequelize
db.sequelize = sequelize

module.exports = db

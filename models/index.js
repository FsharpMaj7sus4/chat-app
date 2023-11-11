const Sequelize = require("sequelize")
const defineUser = require("./User")
const defineRoom = require("./Room")

const { DB_DB, DB_USER, DB_PASSWORD, DB_PORT, DB_HOST, DB_DIALECT } =
  process.env

const sequelize = new Sequelize(DB_DB, DB_USER, DB_PASSWORD, {
  port: DB_PORT, // Your database port
  logging: false,
  host: DB_HOST,
  dialect: DB_DIALECT,
})

const db = {}

db.User = defineUser(Sequelize, sequelize)
db.Room = defineRoom(Sequelize, sequelize)

db.Room.belongsToMany(db.User, {
  through: "UserRoom",
})

db.User.belongsToMany(db.Room, {
  through: "UserRoom",
})

db.Sequelize = Sequelize
db.sequelize = sequelize

module.exports = db

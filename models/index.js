const { Sequelize } = require("sequelize")
const pg = require("pg");

const { DB_DB, DB_USER, DB_PASSWORD, DB_PORT, DB_HOST, DB_DIALECT } =
  process.env

const sequelize = new Sequelize(DB_DB, DB_USER, DB_PASSWORD, {
  port: DB_PORT, // Your database port
  logging: false,
  host: DB_HOST,
  dialect: DB_DIALECT,
})

sequelize
  .authenticate()
  .then(() => {
    console.log("database is connected successfully!")
    sequelize
      .sync()
      .then(() => {
        console.log("database is synced...")
      })
      .catch(() => {
        console.log("database is not synced!")
      })
  })
  .catch(error => {
    console.log("connection error: ", error)
  })

module.exports = sequelize

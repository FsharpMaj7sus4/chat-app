module.exports = (Sequelize, sequelize) => {
  const Room = sequelize.define("Room", {
    name: {
      type: Sequelize.STRING,
      allowNull: false,
    },
  })

  return Room
}

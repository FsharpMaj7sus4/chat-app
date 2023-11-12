module.exports = (Sequelize, sequelize) => {
    const Message = sequelize.define("Message", {
        text: {
            type: Sequelize.STRING,
            defaultValue: ''
        },
        file: {
            type: Sequelize.STRING,
        },
    })
  
    return Message
}
  
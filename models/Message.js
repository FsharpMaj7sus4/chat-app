module.exports = (Sequelize, sequelize) => {
    const Message = sequelize.define("Message", {
        text: {
            type: Sequelize.STRING,
            defaultValue: ''
        },
        isSeen: {
            type: Sequelize.BOOLEAN,
            defaultValue: false
        }
    })

    return Message
}

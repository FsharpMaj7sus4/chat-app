module.exports = (Sequelize, sequelize) => {
    const File = sequelize.define("File", {
        originalName: {
            type: Sequelize.STRING,
        },
        fileName: {
            type: Sequelize.STRING,
        },
        size: {
            type: Sequelize.INTEGER,
        }
    })

    return File
}

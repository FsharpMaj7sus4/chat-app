const {Sequelize} = require('sequelize');

const sequelize = new Sequelize({
    dialect: 'postgres', // Use 'postgres' for PostgreSQL
    host: 'localhost', // Your database host
    port: 5432, // Your database port
    username: 'clead', // Your database username
    password: 'programmer_7', // Your database password
    database: 'chat-app', // Your database name
    logging: false
});

sequelize.authenticate().then(()=> {
    console.log('database is connected successfully!');
}).catch((error) => {
    console.log('connection error: ', error)
})

sequelize.sync().then(() => {
    console.log('database is synced...');
}).catch(() => {
    console.log('database is not synced!')
});

module.exports = sequelize;
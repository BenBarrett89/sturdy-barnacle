require('dotenv').config()

module.exports = {
  development: {
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    define: {
      timestamps: false
    }
  }
}

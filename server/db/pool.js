const { createPool } = require('slonik')

module.exports = createPool(process.env.POSTGRES_CONNECTION_STRING)

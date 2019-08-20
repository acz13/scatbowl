const { setupSlonikMigrator } = require('@slonik/migrator')
const pool = require('./db/pool')

const path = require('path')

const migrator = setupSlonikMigrator({
  migrationsPath: path.join(__dirname, '/db/migrations'),
  pool,
  mainModule: module
})

module.exports = { pool, migrator }

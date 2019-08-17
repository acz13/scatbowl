const { setupSlonikMigrator } = require('@slonik/migrator')
const pool = require('./db/pool')

const migrator = setupSlonikMigrator({
  migrationsPath: __dirname + '/db/migrations',
  pool,
  mainModule: module
})

module.exports = { pool, migrator }

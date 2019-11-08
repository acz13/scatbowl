import { setupSlonikMigrator } from '@slonik/migrator'

import pool from './db/pool'

export { pool }

import path from 'path'

export const migrator = setupSlonikMigrator({
  migrationsPath: path.join(__dirname, '/db/migrations'),
  pool,
  mainModule: module
})

module.exports = { pool, migrator }

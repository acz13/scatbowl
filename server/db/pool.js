import createPool from 'slonik'

export default createPool(process.env.POSTGRES_CONNECTION_STRING)

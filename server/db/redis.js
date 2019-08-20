const redis = require('redis')
const promisifyAll = require('util-promisifyall')

module.exports = promisifyAll(redis.createClient(process.env.REDIS_CONNECTION_STRING))

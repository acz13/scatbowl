const redis = require('redis')
const client = redis.createClient()
const promisifyAll = require('util-promisifyall')

module.exports = promisifyAll(redis.createClient())

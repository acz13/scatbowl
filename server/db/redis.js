import redis from 'redis'
import promisifyAll from 'util-promisifyall'

export default promisifyAll(redis.createClient(process.env.REDIS_CONNECTION_STRING))

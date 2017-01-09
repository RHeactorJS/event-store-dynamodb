import {Promise} from 'bluebird'
import redis from 'redis'
Promise.promisifyAll(redis.RedisClient.prototype)
Promise.promisifyAll(redis.Multi.prototype)

const client = redis.createClient()
client.select(8)

export default {
  clearDb: client.flushdb.bind(client),
  redis: client
}
